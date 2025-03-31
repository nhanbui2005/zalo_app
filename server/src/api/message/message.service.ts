import { Inject, Injectable, NotFoundException } from '@nestjs/common';
// import { UpdateMessageDto } from './dto/update-message.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { MemberEntity } from '../members/entities/member.entity';
import { ChatRoomEntity } from '../chat-room/entities/chat-room.entity';
import { MessageEntity } from './entities/message.entity';
import {
  MemberRole,
  MessageContentType,
  RoomType,
} from '@/constants/entity.enum';
import { CursorPaginatedDto } from '@/common/dto/cursor-pagination/paginated.dto';
import { buildPaginator } from '@/utils/cursor-pagination';
import { CursorPaginationDto } from '@/common/dto/cursor-pagination/cursor-pagination.dto';
import { plainToInstance } from 'class-transformer';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SendMessageReqDto } from './dto/send-message.req.dto';
import { Uuid } from '@/common/types/common.type';
import { EventEmitterKey } from '@/constants/event-emitter.constant';
import { SYSTEM_USER_ID } from '@/constants/app.constant';
import { LoadMoreMessagesReqDto } from './dto/load-more-messages.req.dto';
import { MessageResDto } from './dto/message.res.dto';
import { SortEnum } from '@/constants/sort.enum';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { CloudinaryResponse } from 'src/cloudinary/cloudinary/cloudinary-response';
import { createCacheKey } from '@/utils/cache.util';
import { CacheKey } from '@/constants/cache.constant';
import { SendTextMsgReqDto } from './dto/send-text-msg.req.dto';
import { LoadMessagesFromReqDto } from './dto/load-messages-from.req.dto';
import { RedisService } from '@/redis/redis.service';
import { RelationService } from '../relationship/relation.service';
import { RelationStatus } from '@/constants/entity-enum/relation.enum';
import { ChatRoomService } from '../chat-room/chat-room.service';
import { DetailMessageReqDto } from './dto/get-detail-message-req.dto';
import { NewMessageEvent } from 'src/events/dto/message.gateway.dto';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(MemberEntity)
    private readonly memberRepository: Repository<MemberEntity>,
    @InjectRepository(ChatRoomEntity)
    private readonly chatRoomRepository: Repository<ChatRoomEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
    private readonly redisService: RedisService,
    private readonly chatRoomService: ChatRoomService,
    private relationService: RelationService,
    private eventEmitter: EventEmitter2,
    private cloundService: CloudinaryService,
  ) {}

  async sendMessage(
    dto: SendMessageReqDto,
    file: Express.Multer.File,
    senderId: Uuid,
  ): Promise<MessageResDto> {
    const { roomId, receiverId, content, contentType } = dto;

    let room = null;
    let resultFile: CloudinaryResponse = null;
    let memberSent: MemberEntity;

    if (contentType != MessageContentType.TEXT) {
      resultFile = await this.cloundService.uploadFile(file);
    }

    if (roomId) {
      room = await this.chatRoomRepository
        .createQueryBuilder('chatRoom')
        .select(['chatRoom.id'])
        .leftJoin('chatRoom.members', 'members')
        .addSelect(['members.id', 'members.userId'])
        .where('chatRoom.id = :roomId', { roomId })
        .getOne();
    }

    if (!room) {
      // Nếu không tồn tại room, tạo mới
      room = await this.createChatRoom(senderId, receiverId);
      await this.chatRoomRepository.save(room);
    }

    if (!memberSent) {
      memberSent = await this.memberRepository
        .createQueryBuilder('member')
        .leftJoinAndSelect('member.user', 'user')
        .select(['member.id', 'user.id', 'user.username', 'user.avatarUrl'])
        .where('member.roomId = :roomId', { roomId: room.id })
        .andWhere('member.userId = :userId', { userId: senderId })
        .getOne();
    }

    if (!memberSent) {
      throw new Error('Member sender not found');
    }

    const newMessage = new MessageEntity({
      senderId: memberSent.id,
      sender: memberSent,
      roomId: room.id,
      content:
        contentType == MessageContentType.TEXT
          ? content
          : resultFile.secure_url,
      type: contentType,
      replyMessageId: dto.replyMessageId,
      createdBy: senderId,
      updatedBy: senderId,
    });

    await this.messageRepository.save(newMessage);

    //lọc danh sách member online và offline
    const members = room.members.filter((member) => member.userId != senderId);
    const userClientKeys = members.map((m) =>
      createCacheKey(CacheKey.USER_CLIENT, m.userId),
    );
    const userCacheIds = await this.redisService.mget(...userClientKeys);    
    
    let onlineMembers = [];
    let offineMembers = [];
    userCacheIds.forEach((id, index) => {
      if (id) {
        onlineMembers.push(members[index]);
      } else {
        offineMembers.push(members[index]);
      }
    });

    const result = {
      ...newMessage,
      receivedMembers: onlineMembers.map((m) => m.id),
    };

    // Gửi thông báo sự kiện
    // this.eventEmitter.emit(EventEmitterKey.NEW_MESSAGE, {
    //   id:newMessage.id,
    //   content: contentType == MessageContentType.TEXT ? content : resultFile.secure_url,
    //   type: contentType,
    //   roomId: room.id,
    //   memberSentId: memberSent.id,
    //   sender: memberSent,
    //   createdAt: newMessage.createdAt,
    //   members: room.members.filter(member => member.userId != senderId),
    // });

    return plainToInstance(MessageResDto, result);
  }

  async sendTextMsg(roomId: Uuid, data: SendTextMsgReqDto, meId: Uuid) {
    // check if the room exists
    //Kiểm tra phòng có tồn tại ko    
    const room = await this.chatRoomRepository.findOneOrFail({
      where: { id: roomId },
      select: ['id', 'members'],
      relations: ['members'],
    });

    // check if the user is a member of the room
    const member = await this.memberRepository.findOneOrFail({
      where: {
        roomId: roomId,
        userId: meId,
      },
      select: ['id', 'userId'],
    });
    const newMessageData = new MessageEntity({
      content: data.content,
      sender: member,
      roomId,
      type: MessageContentType.TEXT,
      createdAt: new Date(),
      createdBy: meId,
      updatedBy: meId,
    });
    if (data?.replyMessageId)
      newMessageData.replyMessageId = data.replyMessageId;

    const newMessage = await this.messageRepository.save(newMessageData);
    const newMsg = await this.messageRepository.findOne({
      where: { id: newMessage.id },
      relations: ['replyMessage', 'sender'],
    });
    const { onlineUsersRoom, offlineUsersRoom } =
      await this.chatRoomService.getUserIdsStatusRoom(room.id);      

    this.eventEmitter.emit(EventEmitterKey.NEW_MESSAGE, {
      roomId: roomId,
      onlineUsersRoom: onlineUsersRoom,
      offlineUsersRoom: offlineUsersRoom,
      msgData: newMsg,
      createdAt: new Date(),
    } as NewMessageEvent);
    
    return newMsg
  }

  async loadMoreMessage(
    reqDto: LoadMoreMessagesReqDto,
    meId: Uuid,
  ): Promise<CursorPaginatedDto<MessageResDto>> {
    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .select([
        'message.id',
        'message.type',
        'message.content',
        'message.createdAt',
      ])
      // Lấy message.replyMessage
      .leftJoin('message.replyMessage', 'replyMsg')
      .addSelect([
        'replyMsg.id',
        'replyMsg.type',
        'replyMsg.content',
        'replyMsg.createdAt',
      ])
      // Lấy replyMsg.sender
      .leftJoin('replyMsg.sender', 'replySender')
      .addSelect(['replySender.id'])
      // Lấy user của replyMsg.sender
      .leftJoin('replySender.user', 'replyUser')
      .addSelect(['replyUser.username',])
      // Lấy message.sender
      .leftJoin('message.sender', 'messageSender')
      .addSelect(['messageSender.id'])
      // Lấy user của message.sender
      .leftJoin('messageSender.user', 'messageUser')
      .addSelect([
        'messageUser.id',
        'messageUser.username',
        'messageUser.avatarUrl',
      ])
      .where('message.roomId = :room_id', { room_id: reqDto.roomId });
    const paginator = buildPaginator({
      entity: MessageEntity,
      alias: 'message',
      paginationKeys: ['createdAt'],
      query: {
        limit: reqDto.limit,
        order: SortEnum.DESC,
        afterCursor: reqDto.afterCursor,
        beforeCursor: reqDto.beforeCursor,
      },
    });

    const { data, cursor } = await paginator.paginate(queryBuilder);
    const result = data.map((item) => {
      return {
        ...item,
        isSelfSent: item.sender.user.id == meId,
      };
    });

    const metaDto = new CursorPaginationDto(
      result.length,
      cursor.afterCursor,
      cursor.beforeCursor,
      reqDto,
    );

    return new CursorPaginatedDto(
      plainToInstance(MessageResDto, result),
      metaDto,
    );
  }

  async loadMessageFrom(
    reqDto: LoadMessagesFromReqDto,
    meId: Uuid,
  ): Promise<CursorPaginatedDto<MessageResDto>> {
    const msg = await this.messageRepository.findOne({
      where: { id: reqDto.messageId as Uuid },
      select: ['createdAt'],
    });
    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .select([
        'message.id',
        'message.type',
        'message.content',
        'message.createdAt',
      ])
      .leftJoin('message.replyMessage', 'replyMsg')
      .addSelect([
        'replyMsg.id',
        'replyMsg.type',
        'replyMsg.content',
        'replyMsg.createdAt',
      ])
      .leftJoin('message.sender', 'sender')
      .addSelect(['sender.id'])
      .leftJoin('sender.user', 'user')
      .addSelect(['user.id', 'user.username', 'user.avatarUrl'])
      .where('message.roomId = :room_id', { room_id: reqDto.roomId });

    const beforeMsgsQuery = queryBuilder
      .clone()
      .andWhere('message.createdAt >= :createdAt', {
        createdAt: msg.createdAt,
      });
    const afterMsgsQuery = queryBuilder
      .clone()
      .andWhere('message.createdAt <= :createdAt', {
        createdAt: msg.createdAt,
      });

    const afterPaginator = buildPaginator({
      entity: MessageEntity,
      alias: 'message',
      paginationKeys: ['createdAt'],
      query: {
        limit: reqDto.limit,
        order: SortEnum.DESC,
        afterCursor: reqDto.afterCursor,
        beforeCursor: reqDto.beforeCursor,
      },
    });
    const beforePaginator = buildPaginator({
      entity: MessageEntity,
      alias: 'message',
      paginationKeys: ['createdAt'],
      query: {
        limit: reqDto.limit,
        order: SortEnum.ASC,
        afterCursor: reqDto.afterCursor,
        beforeCursor: reqDto.beforeCursor,
      },
    });

    const beforeData = await beforePaginator.paginate(beforeMsgsQuery);
    const afterData = await afterPaginator.paginate(afterMsgsQuery);

    const data = [...beforeData.data.reverse(), ...afterData.data];
    const cursor = {
      beforeCursor: beforeData.cursor.afterCursor,
      afterCursor: afterData.cursor.afterCursor,
    };
    const result = data.map((item) => {
      return {
        ...item,
        isSelfSent: item.sender.user.id == meId,
      };
    });

    const metaDto = new CursorPaginationDto(
      result.length,
      cursor.afterCursor,
      cursor.beforeCursor,
      reqDto,
    );

    return new CursorPaginatedDto(
      plainToInstance(MessageResDto, result),
      metaDto,
    );
  }

  async findAllMemberByRoomId(roomId: Uuid) {
    const queryBuilder = await this.memberRepository
      .createQueryBuilder('members')
      .where('members.roomId = :roomId', { roomId })
      .getMany();
    return queryBuilder;
  }

  async findDetail(
    roomId: string, // Uuid trong TypeORM thường là string
    reqDto: DetailMessageReqDto
  ): Promise<{ id: string; username: string; avatar: string }[]> {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('member', 'm', 'm.user_id = user.id') 
      .where('m.room_id = :roomId', { roomId }) 
      .andWhere(
        // Điều kiện: isOnline = true HOẶC lastOnline > createdAt
        'user.isOnline = :isOnline OR user.lastOnline > :createdAt',
        { isOnline: true, createdAt: reqDto.messageCraetedAt }
      )
      .select([
        'user.id AS id',
        'user.username AS username',
        'user.avatar AS avatar', // Giả sử cột avatar là 'avatar'
      ])
      .getRawMany();

    return users;
  }

  findAll() {
    return `This action returns all message`;
  }
  findMany(ids: Uuid[]) {
    
    return `This action returns a #${ids} message`;
  }
  findOne(id: number) {
    return `This action returns a #${id} message`;
  }

  // update(id: number, updateMessageDto: UpdateMessageDto) {
  //   return `This action updates a #${id} message`;
  // }

  remove(id: number) {
    return `This action removes a #${id} message`;
  }

  private async createChatRoom(
    senderId: Uuid,
    receiverId: Uuid,
  ): Promise<ChatRoomEntity> {
    const room = new ChatRoomEntity({
      type: RoomType.PERSONAL,
      createdBy: senderId,
      updatedBy: senderId,
    });

    await room.save();

    const member1 = new MemberEntity({
      userId: senderId,
      roomId: room.id,
      role: MemberRole.MEMBER,
      createdBy: SYSTEM_USER_ID,
      updatedBy: SYSTEM_USER_ID,
    });

    const member2 = new MemberEntity({
      userId: receiverId,
      roomId: room.id,
      role: MemberRole.MEMBER,
      createdBy: SYSTEM_USER_ID,
      updatedBy: SYSTEM_USER_ID,
    });

    await this.memberRepository.save([member1, member2]);

    room.members = [member1, member2];
    room.memberLimit = 2;

    await this.chatRoomRepository.save(room);

    return room;
  }

  async getFriendOnAndOfByUserId(
    userId: Uuid,
  ): Promise<{ onlineFriends: string[]; offlineFriends: string[] }> {
    const friends = await this.relationService.getAllRelations(userId as Uuid, RelationStatus.FRIEND);
    const onlineFriends = await this.redisService.smembers(`online_friends:${userId}`);
    const offlineFriends = friends.filter((friendId) => !onlineFriends.includes(friendId));
  
    return { onlineFriends, offlineFriends };
  }
}
