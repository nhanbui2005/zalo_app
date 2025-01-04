import { Injectable } from '@nestjs/common';
import { CreateChatRoomDto } from './dto/create-chat-room.dto';
import { UpdateChatRoomDto } from './dto/update-chat-room.dto';
import { ListRoomReqDto } from './dto/list-room.req.dto';
import { RoomResDto } from './dto/room.res.dto';
import { OffsetPaginationDto } from '@/common/dto/offset-pagination/offset-pagination.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRoomEntity } from '../message/entities/chat-room.entity';
import { Repository } from 'typeorm';
import { SortEnum } from '@/constants/sort.enum';
import { paginate } from '@/utils/offset-pagination';
import { plainToInstance } from 'class-transformer';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { RoomType } from '@/constants/entity.enum';
import { Uuid } from '@/common/types/common.type';

@Injectable()
export class ChatRoomService {

  constructor(
    @InjectRepository(ChatRoomEntity)
    private readonly roomRepository: Repository<ChatRoomEntity>,
  ){}

  create(createChatRoomDto: CreateChatRoomDto) {
    return 'This action adds a new chatRoom';
  }

  async findAll(reqDto: ListRoomReqDto, meId: Uuid): Promise<OffsetPaginatedDto<RoomResDto>> {
    const query = this.roomRepository
      .createQueryBuilder('room')
      .leftJoin('room.members','members')
      .addSelect(['members.id'])
      .leftJoin('members.user','user')
      .addSelect([
        'user.id',
        'user.avatarUrl',
        'user.username'
      ])
      .where('user.id = :meId',{meId: meId})
      .orderBy('room.createdAt', SortEnum.DESC);
    let [rooms, metaDto] = await paginate<ChatRoomEntity>(query, reqDto, {
      skipCount: false,
      takeAll: false,
    });    

    const data = rooms.map(room => {
      let roomAvatarUrl: string
      let roomName: string

      if (room.type == RoomType.PERSONAL) {
        const user = room.members.find(member => member.user.id !=  meId).user
        roomAvatarUrl = user.avatarUrl
        roomName = user.username
      }else{
        roomAvatarUrl = room.groupAvatar
        roomName = room.groupName
      }

      return {
        id: room.id,
        type: room.type,
        roomAvatarUrl,
        roomName
      }
    })    
    return new OffsetPaginatedDto(plainToInstance(RoomResDto, data), metaDto);    
  }

  findOne(id: number) {
    return `This action returns a #${id} chatRoom`;
  }

  update(id: number, updateChatRoomDto: UpdateChatRoomDto) {
    return `This action updates a #${id} chatRoom`;
  }

  remove(id: number) {
    return `This action removes a #${id} chatRoom`;
  }
}
