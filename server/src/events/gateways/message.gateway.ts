import { WebSocketGateway, SubscribeMessage, WebSocketServer, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { RedisService } from '@/redis/redis.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemberEntity } from '../../api/members/entities/member.entity';
import { Uuid } from '@/common/types/common.type';
import { CacheKey } from '@/constants/cache.constant';
import { SocketEmitKey } from '@/constants/socket-emit.constanct';
import { createCacheKey } from '@/utils/cache.util';

import { MessageService } from '@/api/message/message.service';


const CHAT_ROOM = 'CHAT_ROOM_';

@WebSocketGateway({ 
  namespace: 'messages',
  pingInterval: 1000,
  pingTimeout: 2000,
 })
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private typingUsers = new Map<string, Map<string, string>>(); 

  constructor(
    private redisService: RedisService,
    private messageService: MessageService,
    @InjectRepository(MemberEntity)
    private memberRepository: Repository<MemberEntity>,
  ) {}

  async handleConnection(@ConnectedSocket()client: Socket) {
    console.log('nokia');    
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const socketId = client.id;
    const userId = await this.redisService.get(createCacheKey(CacheKey.MSG_SOCKET_CONNECT, socketId)) as Uuid;
  
    if (userId) {
      // 1. Lấy memberId từ JOIN_ROOM để biết user đang ở phòng nào
      const memberId = await this.redisService.get(createCacheKey(CacheKey.JOIN_ROOM, socketId)) as Uuid;
      let roomId: string | null = null;
  
      if (memberId) {
        const member = await this.memberRepository.findOne({
          where: { id: memberId },
          select: ['roomId'],
        });
        roomId = member?.roomId || null;
  
        // 2. Cập nhật thời gian rời phòng
        await this.memberRepository.update({ id: memberId }, { msgVTime: new Date() });
  
        if (roomId) {
          // 3. Xóa trạng thái "writing" nếu có
          const usersTyping = this.typingUsers.get(roomId);
          if (usersTyping) {
            usersTyping.delete(userId); 
          }

          // 5. Rời phòng (đảm bảo client không còn trong phòng)
          client.leave(CHAT_ROOM + roomId);
        }
  
        // 4. Xóa JOIN_ROOM
        await this.redisService.del(createCacheKey(CacheKey.JOIN_ROOM, socketId));
      }      
    }
  }

  @SubscribeMessage('leave-room')
  async handleOutRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,

  ) {
    //rời phòng chat
    client.leave(CHAT_ROOM + data.roomId);
    //member nào ròi
    const memberId = await this.redisService.get(createCacheKey(CacheKey.JOIN_ROOM, client.id));
    //set thời gian rời phòng cho member
    await this.memberRepository.update({id: memberId as Uuid},{msgVTime: new Date()})
    //xóa khỏi danh sách member trong 1 phòng
    await this.redisService.del(createCacheKey(CacheKey.JOIN_ROOM, client.id));
  }
  @SubscribeMessage('writing-message')
  async handleClientMessage(
    @MessageBody() data: { roomId: string; memberId: string; userName: string; status: boolean },
    @ConnectedSocket() client: Socket,
  ) {
  
    // Nếu chưa có roomId trong Map, khởi tạo một Map mới
    if (!this.typingUsers.has(data.roomId)) {
      this.typingUsers.set(data.roomId, new Map());
    }
  
    const usersTyping = this.typingUsers.get(data.roomId)!;
  
    if (data.status) {
      // Thêm user vào danh sách nếu họ đang nhập
      usersTyping.set(data.memberId, data.userName);
    } else {
      // Xóa user khỏi danh sách nếu họ ngừng nhập
      usersTyping.delete(data.memberId);
    }
    
    // Lấy người đang nhập đầu tiên (nếu có)
    const firstUserTyping = Array.from(usersTyping.values())[0] || null;
  
    // Gửi thông tin về phòng
    client.broadcast.to(CHAT_ROOM + data.roomId).emit(SocketEmitKey.WRITING_MESSAGE, {
      userName: firstUserTyping,
    });
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @MessageBody() data: { roomId: string},
    @ConnectedSocket() client: Socket,
  ) {            
    //vào 1 phòng chat
    
    client.join(CHAT_ROOM + data.roomId);
    const userId: string = await this.redisService.get(createCacheKey(CacheKey.MSG_SOCKET_CONNECT, client.id));    
    const member = await this.memberRepository.findOne({
      where:{roomId: data.roomId as Uuid, userId: userId as Uuid},
      select:['id']
    })    
    await this.redisService.set(createCacheKey(CacheKey.JOIN_ROOM, client.id), member.id);

    // Xóa tin nhắn chờ sau khi đã đọc
    const unReceiveMsgRooms = await this.redisService.get(createCacheKey(CacheKey.UNRECEIVE_MSG, userId));
    if (unReceiveMsgRooms) {
      const parsedRooms = JSON.parse(unReceiveMsgRooms);
      delete parsedRooms[data.roomId];
      await this.redisService.set(createCacheKey(CacheKey.UNRECEIVE_MSG, userId), JSON.stringify(parsedRooms));
    }

    //set lại thời gian xem tin nhắn
    await this.memberRepository.update({id: member.id}, {msgVTime: new Date()})

    // Gửi danh sách emoji cho client khi join room
    const emojisKey = createCacheKey(CacheKey.EMOJI_MESSAGE, data.roomId);
    const emojisData = await this.redisService.get(emojisKey );
    const emojis = emojisData ? JSON.parse(emojisData) : {};
    client.emit(SocketEmitKey.EMOJIS_WHEN_CONNECT, emojis);

  }
 @SubscribeMessage('new-emojis-message')
  async handleEmojisMessage(
    @MessageBody() data: { roomId: string; messageId: string; emojis: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, messageId, emojis } = data;

    // 1. Lấy userId từ client
    const userId = await this.redisService.get(createCacheKey(CacheKey.MSG_SOCKET_CONNECT, client.id));
    if (!userId) {
      return;
    }

    // 2. Lưu emoji vào Redis
    const emojisKey = createCacheKey(CacheKey.EMOJI_MESSAGE, roomId);
    const emojisData = await this.redisService.get(emojisKey);
    let emojisMap: { [messageId: string]: Array<{ userId: string; emoji: string; createdAt: Date }> } = emojisData
      ? JSON.parse(emojisData)
      : {};

    // Thêm emoji mới vào danh sách
    if (!emojisMap[messageId]) {
      emojisMap[messageId] = [];
    }
    emojisMap[messageId].push({
      userId,
      emoji: emojis,
      createdAt: new Date(),
    });

    // Lưu lại vào Redis
    await this.redisService.set(emojisKey, JSON.stringify(emojisMap));

    // 3. Gửi thông tin emoji mới đến tất cả người dùng trong phòng
    const emojiData = {
      messageId,
      userId,
      emoji: emojis,
      createdAt: new Date(),
    };
    this.server.to(CHAT_ROOM + roomId).emit(SocketEmitKey.EMOJI_MESSAGE, emojiData);
  }
}