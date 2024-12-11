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
  MessageContentType,
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
import { createEventKey } from '@/utils/socket.util';
import { EventKey } from '@/constants/event.constants';
import { EventEmitterKey } from '@/constants/event-emitter.constant';

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
    let room = await this.chatRoomRepository.findOne({ 
      where: { id: roomId },
      relations:['members']
    });

    if (!roomId) {
      room = new ChatRoomEntity({
        type: RoomType.PERSONAL,
      });
      await this.chatRoomRepository.save(room);

      const member1 = new MemberEntity({
        userId: senderId,
        roomId: room.id,
        role: MemberRole.MEMBER,
      });
      const member2 = new MemberEntity({
        userId: receiverId,
        roomId: room.id,
        role: MemberRole.MEMBER,
      });

      await this.memberRepository.save([member1, member2]);
    }

    const newMessage = new MessageEntity({
      senderId: senderId,
      roomId: room.id,
      content: content,
      type: contentType,
      status: MessageViewStatus.RECEIVED,
    });
    await this.messageRepository.save(newMessage);

    //sent notify to user reister this room or receiver

    this.eventEmitter.emit(EventEmitterKey.NEW_MESSAGE, {
      status: 'ok',
      members: room.members,
    });
  }

  async loadMoreMessage(reqDto: any): Promise<CursorPaginatedDto<any>> {
    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .where('message:roomId = roomId', { roomId: reqDto.roomId });
    const paginator = buildPaginator({
      entity: MessageEntity,
      alias: 'message',
      paginationKeys: ['createdAt'],
      query: {
        limit: reqDto.limit,
        order: 'DESC',
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

    return new CursorPaginatedDto(plainToInstance(UserResDto, data), metaDto);
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
}
