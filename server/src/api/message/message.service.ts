import { Injectable } from '@nestjs/common';
// import { UpdateMessageDto } from './dto/update-message.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { MemberEntity } from './entities/member.entity';
import { ChatRoomEntity } from './entities/chat-room.entity';
import { MessageEntity } from './entities/message.entity';
import {
  MemberRole,
  MessageViewStatus,
  RoomType,
} from '@/constants/entity.enum';
import { CursorPaginatedDto } from '@/common/dto/cursor-pagination/paginated.dto';
import { buildPaginator } from '@/utils/cursor-pagination';
import { CursorPaginationDto } from '@/common/dto/cursor-pagination/cursor-pagination.dto';
import { plainToInstance } from 'class-transformer';
import { UserResDto } from '../user/dto/user.res.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SendMessageReqDto } from './dto/send-message.req.dto';
import { Uuid } from '@/common/types/common.type';
import { EventEmitterKey } from '@/constants/event-emitter.constant';
import { SYSTEM_USER_ID } from '@/constants/app.constant';
import { LoadMoreMessagesReqDto } from './dto/load-more-messages.req.dto';
import { MessageResDto } from './dto/message.res.dto';
import { SortEnum } from '@/constants/sort.enum';

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
    private eventEmitter: EventEmitter2,
  ) {}

  async sendMessage(dto: SendMessageReqDto, senderId: Uuid) {
    const { roomId, receiverId, content, contentType } = dto;
    
    let room = await this.chatRoomRepository
      .createQueryBuilder('chatRoom')
      .select([
        'chatRoom.id',
      ])
      .leftJoin('chatRoom.members', 'members')
      .addSelect(['members.id','members.userId']) 
      .where('chatRoom.id = :roomId', { roomId })
      .getOne();

    let memberSent: MemberEntity;
  
    if (!room) {
      // Nếu không tồn tại room, tạo mới
      room = await this.createChatRoom(senderId, receiverId);
      await this.chatRoomRepository.save(room);
    }
  
    if (!memberSent) {
      memberSent = await this.memberRepository.findOne({
        where: { roomId, userId: senderId },
      });
    }
    
    if (!memberSent) {
      throw new Error('Member sender not found');
    }
    
    const newMessage = new MessageEntity({
      senderId: memberSent.id,
      roomId: room.id,
      content,
      type: contentType,
      status: MessageViewStatus.RECEIVED,
      createdBy: senderId,
      updatedBy: senderId,
    });
    
    await this.messageRepository.save(newMessage);
  
    // Gửi thông báo sự kiện
    this.eventEmitter.emit(EventEmitterKey.NEW_MESSAGE, {
      status: 'ok',
      content,
      contentType,
      roomId: room.id,
      memberSentId: memberSent.id,
      members: room.members,
    });
  }
  

  async loadMoreMessage(reqDto: LoadMoreMessagesReqDto): Promise<CursorPaginatedDto<MessageResDto>> {    
    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .where('message.room_id = room_id', { room_id: reqDto.roomId });
    const paginator = buildPaginator({
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

    const { data, cursor } = await paginator.paginate(queryBuilder);

    const metaDto = new CursorPaginationDto(
      data.length,
      cursor.afterCursor,
      cursor.beforeCursor,
      reqDto,
    );

    return new CursorPaginatedDto(plainToInstance(MessageResDto, data), metaDto);
  }

  findAll() {
    return `This action returns all message`;
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

  private async createChatRoom(senderId: Uuid, receiverId: Uuid): Promise<ChatRoomEntity> {
    const room = new ChatRoomEntity({
      type: RoomType.PERSONAL,
      createdBy: senderId,
      updatedBy: senderId,
    });
  
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
  
}
