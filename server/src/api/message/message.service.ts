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
  MessageViewStatus,
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

  async sendMessageUnified(
    roomId: Uuid,
    dto: SendMessageReqDto,
    senderId: Uuid,
    file?: Express.Multer.File,
  ): Promise<MessageResDto> {
    const { receiverId, content, contentType, replyMessageId } = dto;  
    // Tìm phòng chat
    let room = await this.chatRoomRepository.findOne({
      where: { id: roomId },
      select: ['id', 'members'],
      relations: ['members'],
    });
  
    // Nếu không tìm thấy phòng, tạo phòng mới
    if (!room) {
      room = await this.createChatRoom(senderId, receiverId);
      await this.chatRoomRepository.save(room);
    }
  
    // Tìm thành viên gửi tin nhắn trong phòng chat
    const memberSent = await this.memberRepository.findOne({
      where: { roomId: room.id, userId: senderId },
      select: ['id', 'userId'],
    });
  
    if (!memberSent) throw new Error('Member sender not found');
  
    let fileUrl = null;
    let fileInfo = null;
  
    // Nếu có file và contentType không phải là văn bản
    if (contentType !== MessageContentType.TEXT && file) {
      // Upload file lên Cloudinary
      const resultFile = await this.cloundService.uploadFile(file);
      fileUrl = resultFile.secure_url;
  
      // Thông tin chi tiết về file (nếu là video hoặc hình ảnh)
      fileInfo = {
        url: resultFile.secure_url,
        public_id: resultFile.public_id,
        format: resultFile.format,
        bytes: resultFile.bytes,
        width: resultFile.width || null,
        height: resultFile.height || null,
        duration: resultFile.duration || null, // Nếu là video
        preview_url: resultFile.resource_type === 'video' ? resultFile.preview_url : null, // Thumbnail của video
      };
    }
  
    // Tạo đối tượng tin nhắn mới
    const newMessage = new MessageEntity({
      senderId: memberSent.id,
      sender: memberSent,
      roomId: room.id,
      content: contentType === MessageContentType.TEXT ? content : fileUrl,
      type: contentType,
      replyMessageId,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: senderId,
      updatedBy: senderId,
    });
  
    // Lưu tin nhắn vào cơ sở dữ liệu
    await this.messageRepository.save(newMessage);
  
    // Lấy danh sách người dùng trong phòng chat (online và offline)
    const { onlineUsersRoom, offlineUsersRoom } = await this.chatRoomService.getUserIdsStatusRoom(room.id);
  
    // Emit sự kiện tin nhắn mới
    this.eventEmitter.emit(EventEmitterKey.NEW_MESSAGE, {
      roomId: room.id,
      onlineUsersRoom,
      offlineUsersRoom,
      msgData: newMessage,
      createdAt: new Date(),
    });
  
    // Kiểm tra trạng thái tin nhắn (đã nhận hay chưa)
    const messageStatus =
      onlineUsersRoom.length > 0 ? MessageViewStatus.RECEIVED : MessageViewStatus.SENT;
  
    // Trả về thông tin tin nhắn đã được xử lý
    return plainToInstance(MessageResDto, { 
      ...newMessage, 
      status: messageStatus,
      fileInfo: fileInfo || null, // Thêm thông tin file vào response nếu có
    });
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
