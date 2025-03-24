import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateChatRoomDto } from './dto/update-chat-room.dto';
import { ListRoomReqDto } from './dto/list-room.req.dto';
import { RoomResDto } from './dto/room.res.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRoomEntity } from './entities/chat-room.entity';
import { Repository } from 'typeorm';
import { paginate } from '@/utils/offset-pagination';
import { plainToInstance } from 'class-transformer';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { MemberRole, MessageViewStatus, RoomLimit, RoomType } from '@/constants/entity.enum';
import { Uuid } from '@/common/types/common.type';
import { MemberEntity } from '../message/entities/member.entity';
import { MessageEntity } from '../message/entities/message.entity';
import { CreateGroupReqDto } from './dto/create-group.req.dto';
import { SYSTEM_USER_ID } from '@/constants/app.constant';
import assert from 'assert';
import { RedisService } from '@/redis/redis.service';
import { UserEntity } from '../user/entities/user.entity';
const fs = require('fs');

@Injectable()
export class ChatRoomService {

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(ChatRoomEntity)
    private readonly roomRepository: Repository<ChatRoomEntity>,
    @InjectRepository(MemberEntity)
    private readonly memberRepository: Repository<MemberEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
    private readonly redisService: RedisService,
  ){}

  async createGroupRoom(dto: CreateGroupReqDto, meId: Uuid) : Promise<RoomResDto>{
    //create and save new group
    const newRoom = new ChatRoomEntity({
      type: RoomType.GROUP,
      roomName: dto?.roomName,
      roomAvatar: dto?.roomAvatar,
      memberLimit: RoomLimit.GROUP,
      createdBy: meId,
      updatedBy: SYSTEM_USER_ID
    })
    await this.roomRepository.save(newRoom)

    //create and save members
    const members = dto.userIds.map(id => new MemberEntity({
        role: MemberRole.MEMBER,
        roomId: newRoom.id,
        userId: id,
        createdBy: SYSTEM_USER_ID,
        updatedBy: SYSTEM_USER_ID
    }))
    const leader = new MemberEntity({
      role: MemberRole.LEADER,
      roomId: newRoom.id,
      userId: meId,
      createdBy: SYSTEM_USER_ID,
      updatedBy: SYSTEM_USER_ID
    })
    members.push(leader)
    await this.memberRepository.save(members)

    newRoom.members = members
    return plainToInstance(RoomResDto,newRoom);
  }

  async createPersonalRoom(userId: Uuid, myId: Uuid): Promise<RoomResDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    // Tạo phòng chat mới với đầy đủ các trường
    const room = new ChatRoomEntity({
      type: RoomType.PERSONAL,
      memberLimit: 2,
      roomName: user.username, 
      roomAvatar: user.avatarUrl,
      createdBy: myId,
      updatedBy:  SYSTEM_USER_ID,
      createdAt: new Date(),
      updatedAt: new Date(), 
    });
  
    const newRoom = await this.roomRepository.save(room);
  
    // Tạo thành viên 1 với đầy đủ các trường
    const member1 = new MemberEntity({
      userId: userId,
      roomId: newRoom.id,
      role: MemberRole.MEMBER,
      createdBy: SYSTEM_USER_ID,
      updatedBy: SYSTEM_USER_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  
    // Tạo thành viên 2 với đầy đủ các trường
    const member2 = new MemberEntity({
      userId: myId,
      roomId: newRoom.id,
      role: MemberRole.MEMBER,
      createdBy: SYSTEM_USER_ID,
      updatedBy: SYSTEM_USER_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  
    // Lưu danh sách thành viên
    await this.memberRepository.save([member1, member2]);
  
    // Gán danh sách thành viên vào phòng (nếu cần cho RoomResDto)
    newRoom.members = [member1, member2];
  
    // Chuyển đổi và trả về RoomResDto
    return plainToInstance(RoomResDto, newRoom);
  }

  async findAll(reqDto: ListRoomReqDto,meId: Uuid): Promise<OffsetPaginatedDto<RoomResDto>> {

    const msgSubQuery = this.messageRepository
      .createQueryBuilder('msg')
      .select('msg.id')
      .where('msg.roomId = r.id')
      .orderBy('msg.createdAt', 'DESC')
      .limit(99)
      .getQuery();

    const query = this.roomRepository
      .createQueryBuilder('r')
      .select([
        'r.id','r.type','r.roomName','r.roomAvatar',
        'm2.id','m2.msgVTime',
        'u.id','u.username','u.avatarUrl',
        'msg.id','msg.content','msg.type','msg.createdAt','msg.senderId','msg.sender','msg.roomId','msg.replyMessageId',
        'user.username',
        'sender.id','sender.user',
      ])
      .leftJoin('r.members', 'm', 'm.userId = :userId', { userId: meId })
      .leftJoin('r.members', 'm2')
      .leftJoin('r.messages', 'msg', `msg.id IN (${msgSubQuery})`)
      .leftJoin('msg.sender','sender')
      .leftJoin('sender.user','user')
      .leftJoin('m2.user','u')
      .where('m.userId = :meId',{meId})
      .orderBy('msg.createdAt', 'DESC')

    let [rooms, metaDto] = await paginate<ChatRoomEntity>(query, reqDto, {
      skipCount: true,
      takeAll: true,
    });    

    fs.writeFileSync('rooms.json', JSON.stringify(rooms, null, 2));
    

    const data = rooms.map((room) => {
      const isGroup = room.type == RoomType.GROUP
      const memberMe = room.members.filter(m => m.user.id == meId)[0]
      const memberPartner = room.members.filter(m => m.user.id != meId)[0]
      const roomAvatar = isGroup 
        ? (room.roomAvatar || room.members.slice(0, 5).map(m => m.user.id).join(',')) 
        : memberPartner.user.avatarUrl
      const roomName = isGroup 
        ? (room.roomName || room.members.slice(0, 5).map(m => m.user.username).join(', ')) 
        : memberPartner.user.username

      return {
        id: room.id,
        roomName,
        type: room.type,
        lastMsg: {
          ...room.messages[0],
          isSelfSent: memberMe.id == room.messages[0]?.senderId,
        },
        unReadMsgCount: room.messages.filter(m => memberMe.msgVTime < m.createdAt).length,
        roomAvatar,
        ...(isGroup && {memberCount: room.members.length}),
      }
    })    

    return new OffsetPaginatedDto(plainToInstance(RoomResDto, data), metaDto);
  }

  async findAllGroups(reqDto: ListRoomReqDto, meId: Uuid): Promise<OffsetPaginatedDto<RoomResDto>> {
    const roomIds = this.roomRepository
      .createQueryBuilder('r')
      .select(['r.id','r.type'])
      .leftJoinAndSelect('r.members','m')
      .leftJoinAndSelect('r.members','m2')
      .leftJoin('m2.user','u')
      .addSelect([
        'u.id',
        'u.username',
        'u.avatarUrl'
      ])
      .where('m.userId = :meId',{meId})
      .andWhere('r.type = :type',{type: RoomType.GROUP})

    let [rooms, metaDto] = await paginate<ChatRoomEntity>(roomIds, reqDto, {
      skipCount: true,
      takeAll: true,
    });
    
    const data = await Promise.all(
      rooms.map(async room => {
        let roomAvatar: string = room.roomAvatar
        let roomName: string = room.roomName || this.getRoomNameFromMembers(room.members)

        return {
          id: room.id,
          type: room.type,
          members:room.members,
          roomAvatar,
          roomName,
        }
      })
    )

    return new OffsetPaginatedDto(plainToInstance(RoomResDto, data), metaDto);
  }

  async findOne(roomId: Uuid, meId: Uuid): Promise<RoomResDto> {
    assert(roomId, 'id is required');
    const room = await this.roomRepository
      .createQueryBuilder('r')
      .select([
        'r.id','r.type',
        'u.id','u.avatarUrl','u.username'
      ])
      .leftJoinAndSelect('r.members','m')
      .leftJoin('m.user','u')
      .where('r.id = :roomId',{roomId})
      .getOne()


    const isGroup = room.type == RoomType.GROUP
    const memberMe = room.members.filter(m => m.user.id == meId)[0]
    const memberPartner = room.members.filter(m => m.user.id != meId)[0]
    const roomAvatar = isGroup 
      ? (room.roomAvatar || room.members.slice(0, 5).map(m => m.user.id).join(',')) 
      : memberPartner.user.avatarUrl
    const roomName = isGroup 
      ? (room.roomName || room.members.slice(0, 5).map(m => m.user.username).join(', ')) 
      : memberPartner.user.username

    return plainToInstance(RoomResDto, {
      id: room.id,
      roomName,
      type: room.type,
      memberId: memberMe.id,
      members:room.members,
      roomAvatar,
      ...(isGroup && {memberCount: room.members.length}),
    })

    // const memberId = room.members.find(m => m.user.id == meId).id
    // const isGroup = room.type == RoomType.GROUP
      
    // const result = {
    //   ...room,
    //   roomAvatarUrl: room.groupAvatar || room.members.slice(0, 5).map(m => m.user.avatarUrl).join(', '),
    //   memberId
    // }
    // return plainToInstance(RoomResDto, result)
  }

  async findOneByPartnerId(meId: Uuid, partnerId: Uuid): Promise<RoomResDto>{
    // const room = await this.memberRepository
    //   .createQueryBuilder('m')
    //   .innerJoinAndSelect('m.room', 'r')
    //   .select([
    //     'm.roomId AS roomId',
    //   ])
    //   .where('m.userId IN (:...userIds)', { userIds: [meId, partnerId] })
    //   .andWhere('r.type = :type', { type: RoomType.PERSONAL })
    //   .groupBy('m.roomId') 
    //   .having('COUNT(DISTINCT m.userId) = :count', { count: 2 })
    //   .getRawOne();

    // if (!room) {
    //   throw new NotFoundException('Not found room')
    // }

    const room = await this.getPersonalRoomFromUsers(meId, partnerId)

    if (!room) {
      throw new NotFoundException('Not found room')
    }    

    const partner = room.members.find(m => m.user.id == partnerId)
    
    const result = {
      ...room,
      roomAvatar: partner.user.avatarUrl,
      roomName: partner.user.username
    }    
    return plainToInstance(RoomResDto, result)
  }

  update(id: number, updateChatRoomDto: UpdateChatRoomDto) {
    return `This action updates a #${id} chatRoom`;
  }

  remove(id: number) {
    return `This action removes a #${id} chatRoom`;
  }

  getLastMsgByRoomId = async (roomId: Uuid) => {
    return await this.messageRepository
        .createQueryBuilder('msg')
        .select([
          'msg.content',
          'msg.type',
          'msg.senderId',
          'msg.createdAt',
        ])
        .leftJoin('msg.sender','sender')
        .addSelect([
          'sender.id',
          'sender.userId',
        ])
        .where('msg.roomId = :roomId',{roomId: roomId})
        .orderBy({'msg.createdAt':'DESC'})
        .getOne()
  }

  getQuantityUnReadMessages = async (roomId: Uuid) => {
    return await this.messageRepository
      .createQueryBuilder('msg')
      .select('COUNT(msg.id)', 'unreadCount')  // Đếm số tin nhắn chưa đọc
      .where('msg.roomId = :roomId',{roomId: roomId})
      .andWhere('msg.status != :status', { status: MessageViewStatus.VIEWED })  // Loại bỏ tin nhắn đã xem
      .getRawOne(); 
  };

  getLastMsgByRoomIds = async (roomIds: Uuid[]) => {
    return await this.messageRepository
        .createQueryBuilder('msg')
        .select([
          'msg.content',
          'msg.type',
          'msg.senderId',
          'msg.createdAt',
        ])
        .leftJoin('msg.sender','sender')
        .addSelect([
          'sender.id',
          'sender.userId',
        ])
        .where('msg.roomId IN (:...roomIds)',{roomIds})
        .orderBy({'msg.createdAt':'DESC'})
        .getMany()
  }

  getRoomNameFromMembers = (members: MemberEntity[]): string => {
    let name = ''
    for (let index = 0; index < members.length; index++) {
      if (index == 4) {
        break
      }
      name += members[index].user.username
      if (index < members.length - 1) {
        name += ', '
      }
    }
    return name
  }

  getPersonalRoomFromUsers = async (userId: Uuid, myId: Uuid) => {
    const room = await this.roomRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.members','m', 'm.userId IN (:...userIds)', { userIds: [userId, myId] })
      .leftJoinAndSelect('m.user','u')
      .where('r.type = :type', { type: RoomType.PERSONAL })
      .getOne()    
      
    if (room && room.members.length == 2) {
      return room
    }  

    return null
  }
  // private async getUserIdsOfRoomsByUserId(userId: Uuid): Promise<{ [roomId: string]: Set<string> }> {
  //   const rooms = await this.roomRepository
  //     .createQueryBuilder('r')
  //     .leftJoinAndSelect('r.members', 'm')
  //     .where(
  //       `EXISTS (
  //         SELECT 1
  //         FROM member rm
  //         WHERE rm.roomId = r.id
  //         AND rm.userId = :userId
  //       )`,
  //       { userId }
  //     )
  //     .getMany();

  //   const result: { [roomId: string]: Set<string> } = {};
  //   rooms.forEach(room => {
  //     result[room.id] = new Set(room.members.map(member => member.userId));
  //   });

  //   return result;
  // }
  async getAllRoomIdsByUserId(userId: Uuid): Promise<string[]> {
    const rooms = await this.roomRepository
      .createQueryBuilder('r')
      .select('r.id')
      .where(
        `EXISTS (
          SELECT 1
          FROM member rm
          WHERE rm.room_id = r.id
          AND rm.user_id = :userId
        )`,
        { userId }
      )
      .getMany();
    return rooms.map(room => room.id);
  }
  // async getUserIdsStatusAllRoom(userId: Uuid): Promise<{
  //   onlineUsersRooms: string[];
  //   offlineUsersRooms: string[];
  // }> {
  //   // Lấy danh sách userId trong các phòng
  //   const userIdsRooms = await this.getUserIdsOfRoomsByUserId(userId);

  //   // Lấy tất cả roomId mà user tham gia
  //   const roomIds = await this.getAllRoomIdsByUserId(userId);

  //   // Tập hợp tất cả userId từ các phòng (loại bỏ trùng lặp)
  //   const allUserIds = new Set<string>();
  //   Object.values(userIdsRooms).forEach(userIds => {
  //     userIds.forEach(id => allUserIds.add(id));
  //   });

  //   // Lấy danh sách userId online từ Redis cho từng phòng
  //   const onlineUsersRooms = new Set<string>();
  //   await Promise.all(
  //     roomIds.map(async (roomId) => {
  //       const onlineUsers = await this.redisService.smembers(`online_user_room:${roomId}`);
  //       onlineUsers.forEach(userId => onlineUsersRooms.add(userId));
  //     })
  //   );

  //   // Tính danh sách userId offline
  //   const offlineUsersRooms = new Set<string>();
  //   allUserIds.forEach(id => {
  //     if (!onlineUsersRooms.has(id)) {
  //       offlineUsersRooms.add(id);
  //     }
  //   });

  //   // Chuyển Set thành mảng để trả về
  //   return {
  //     onlineUsersRooms: Array.from(onlineUsersRooms),
  //     offlineUsersRooms: Array.from(offlineUsersRooms),
  //   };
  // }
  private async getUserIdsRoom(roomId: string): Promise<string[]> {
    const room = await this.roomRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.members', 'm')
      .where('r.id = :roomId', { roomId })
      .getOne();
  
    if (!room || !room.members) {
      return [];
    }
  
    return room.members.map(member => member.userId);
  }

  async getUserIdsStatusRoom(roomId: string): Promise<{
    onlineUsersRoom: string[];
    offlineUsersRoom: string[];
  }> {
    const allUserIds = await this.getUserIdsRoom(roomId);
    if (allUserIds.length === 0) {
      return { onlineUsersRoom: [], offlineUsersRoom: [] };
    }
  
    // Tạo danh sách key để truy vấn Redis
    const redisKeys = allUserIds.map(userId => `USER_CLIENT:${userId}`);
  
    // Lấy tất cả socketId trong một lần gọi MGET
    const socketIds = await this.redisService.mget(...redisKeys);
  
    const onlineUsersRoom = allUserIds.filter((_, index) => socketIds[index] !== null);

    const offlineUsersRoom = allUserIds.filter((_, index) => socketIds[index] === null);
      
    return {
      onlineUsersRoom,
      offlineUsersRoom,
    };
  }
}
