import { WebSocketGateway, SubscribeMessage, WebSocketServer, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { RedisService } from '@/redis/redis.service';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MessageEntity } from '@/api/message/entities/message.entity';
import { MemberEntity } from '@/api/members/entities/member.entity';
import { Uuid } from '@/common/types/common.type';
import { CacheKey } from '@/constants/cache.constant';
import { createCacheKey } from '@/utils/cache.util';
import { UserEntity } from '@/api/user/entities/user.entity';
import { RelationService } from '@/api/relationship/relation.service';
import { MessageService } from '@/api/message/message.service';
import { WsAuthService } from '../events.service';
import { SocketEmitKey } from '@/constants/socket-emit.constanct';
import { RelationStatus } from '@/constants/entity-enum/relation.enum';
import { EventEmitterKey } from '@/constants/event-emitter.constant';
import { OnEvent } from '@nestjs/event-emitter';
import { ChatRoomService } from '@/api/chat-room/chat-room.service';
import Redis from 'ioredis';
import { NewMessageEvent } from '../dto/message.gateway.dto';


const CHAT_ROOM = 'CHAT_ROOM_';
const SOCKET_ROOM = 'socket_room:';
const SOCKET_FRIEND = 'socket_friend:';

@WebSocketGateway(
  { 
    namespace: '/notifications',
    pingInterval: 1000, 
    pingTimeout: 2000, 
  }
)
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  
  private pendingAcks: Map<string, Map<string, string>> = new Map();

  constructor(
    private wsAuthService: WsAuthService,
    private redisService: RedisService,
    private chatRoomService: ChatRoomService,
    private readonly relationService: RelationService,
    private readonly messageService: MessageService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(MessageEntity)
    private messageRepository: Repository<MessageEntity>,
    @InjectRepository(MemberEntity)
    private memberRepository: Repository<MemberEntity>,
  ) {
    this.listenToRedisEvents();
  }

  async handleConnection(@ConnectedSocket() client: Socket) {
   try {    

    this.wsAuthService.onClientConnect(client);
    await this.wsAuthService.finishInitialization(client);
    
    const { pendingMessages, id: userId } = client.data.user;    
    
     // Cập nhật trạng thái online
     await this.userRepository.update({ id: userId }, { isOnline: true });
     this.notifyFriendStatus({ userId, isOnline: true, lastOnline: new Date() });

     // Join tất cả room
     const roomIds = await this.chatRoomService.getAllRoomIdsByUserId(userId);
     roomIds.forEach(id => client.join(SOCKET_ROOM + id));

    //xóa khi connect lại
    const key = `poit-user-disconnect:${userId}`;
    await this.redisService.del(key);

    // Gửi lại tin nhắn chờ
    if (pendingMessages && pendingMessages.length > 0) {
      await this.loadPendingMessages(userId, client);
    }

    //Gửi lại đồng ý kb
    this.handlePendingAcceptReq(client, userId)
   
    console.log(`MSG-SOCKET-CONNECT:: ${userId}`);

   } catch (error) {
    
   }
  }
  async handleDisconnect(@ConnectedSocket() client: Socket): Promise<void> {
    try {
      const userId = await this.getUserId(client);
      if (!userId) return;

      await Promise.all([
        this.redisService.del(createCacheKey(CacheKey.MSG_SOCKET_CONNECT, client.id)),
        this.redisService.del(createCacheKey(CacheKey.USER_CLIENT, userId)),
      ]);

      await this.redisService.set(`poit-user-disconnect:${userId}`,`${Number(new Date())}`, 5);

      console.log('disconnect');
      
    } catch (error) {
      console.error(`Error in handleDisconnect for client ${client.id}:`, error);
    }
  }


  @OnEvent(EventEmitterKey.NEW_MESSAGE)
  async newMessage(data: NewMessageEvent) {
    try {
      const { onlineUsersRoom, offlineUsersRoom, msgData, roomId, createdAt } = data;

      const msgId = msgData.id;
      const msgDataStr = JSON.stringify(msgData);      

      // Gửi đến user online qua WebSocket
      this.server.to(SOCKET_ROOM + roomId).emit(SocketEmitKey.NEW_MESSAGE, msgData);

      if (onlineUsersRoom.length > 0) {
        
        await this.memberRepository.update(
          { id: In(onlineUsersRoom.map((m) => m)) },
          { msgRTime: new Date(createdAt) },
        );
        
        const msgAcks = new Map<Uuid, string>();
        onlineUsersRoom.forEach((userId: Uuid) => msgAcks.set(userId  , msgDataStr));
        this.pendingAcks.set(msgId, msgAcks);
      }

      // Xử lý user offline (lưu tin nhắn) 
      if (offlineUsersRoom.length > 0) {
        console.log(offlineUsersRoom);
        
        const mKeys = offlineUsersRoom.map((userId: Uuid) => createCacheKey(CacheKey.UNRECEIVE_MSG, userId));
        const mOldOffData = await this.redisService.mget(...mKeys);

        const mNewOffData: Array<[string, string]> = mOldOffData.map((oldData, index) => {
          const key = mKeys[index];
          let roomMessages: Record<string, string[]> = oldData ? JSON.parse(oldData) : {};
          if (!Array.isArray(roomMessages[roomId])) {
            roomMessages[roomId] = [];
          }
          roomMessages[roomId].push(msgId);
          return [key, JSON.stringify(roomMessages)];
        });

        await this.redisService.mset(mNewOffData);

      }
    } catch (error) {
      console.error('Error in newMessage:', error);
    }
  }

  @OnEvent(EventEmitterKey.UPDATE_RELATION_REQ)
  async acceptRelationReq(data: any) {
    const {status, memberId, memberMeId,room, user} = data 
    const acceptRelationData = {
      memberId: memberMeId,
      memberMeId: memberId,
      status,
      room,
      user
    }

    const clientId = await this.redisService.get(createCacheKey(CacheKey.USER_CLIENT, user.id));
    //có clinetId chứng tỏ online
    if (clientId) {
      // Nếu user online, gửi sự kiện socket
      this.server.to(clientId).emit(SocketEmitKey.ACCEPT_RELATION_REQ, acceptRelationData);
    } else {
      //of thì catch lại
      this.redisService.lpush(
        createCacheKey(CacheKey.UNRECEIVE_HANDLE_REQUEST_RELATION),
        JSON.stringify(acceptRelationData)
      )
    }
  }
  

  @SubscribeMessage('ack_message')
  async handleAckMessage(@MessageBody() msgId: string, @ConnectedSocket() client: Socket) {
    const userId = (await this.redisService.get(
      createCacheKey(CacheKey.MSG_SOCKET_CONNECT, client.id),
    )) as Uuid;
    const msgAcks = this.pendingAcks.get(msgId);
    if (msgAcks) {
      msgAcks.delete(userId);
      if (msgAcks.size === 0) this.pendingAcks.delete(msgId);
    }
  }

  private async loadPendingMessages(userId: string, client: Socket) {
    const key = createCacheKey(CacheKey.UNRECEIVE_MSG, userId);
    const roomMessages = await this.redisService.get(key);
    if (!roomMessages) return;

    const parsedMessages: Record<string, string[]> = JSON.parse(roomMessages) || {};
    const roomIds = Object.keys(parsedMessages);
    if (!roomIds.length) {
      await this.redisService.del(key);
      return;
    }

    const messagePromises = Object.entries(parsedMessages)
      .filter(([_, messageIds]) => messageIds?.length)
      .map(async ([roomId, messageIds]) => {
        const messages = await this.messageRepository.find({
          where: { id: In(messageIds) },
        });
        
        client.emit(SocketEmitKey.LOAD_MORE_MSGS_WHEN_CONNECT, {
          roomId,
          messages,
        });
        this.server.to(SOCKET_ROOM + roomId).emit(SocketEmitKey.RECEIVED_MSG, 
          {
            userId: userId,
            receivedAt: new Date(),
          }
        );

      });

    await Promise.all(messagePromises);
    await this.redisService.del(key);

    const members = await this.memberRepository.find({
      where: { roomId: In(roomIds), userId: userId as Uuid },
    });
    await Promise.all([
      this.memberRepository.update(
        { userId: userId as Uuid },
        { msgRTime: new Date() },
      ),
      // ...members.map((member) =>
      //   this.server.to(CHAT_ROOM + member.roomId).emit(SocketEmitKey.RECEIVED_MSG, {
      //     roomId: member.roomId,
      //     memberId: member.id,
      //     receivedAt: new Date(),
      //   }),
      // ),
    ]);
  }

  async notifyFriendStatus(status: { userId: Uuid; isOnline: boolean; lastOnline: Date }) {
    const multi = this.redisService.multi();
    const { offlineFriends, onlineFriends } = await this.messageService.getFriendOnAndOfByUserId(status.userId);
    const friends = await this.relationService.getAllRelations(status.userId, RelationStatus.FRIEND);

    if (onlineFriends.length > 0) {
      const socketIds = await Promise.all(
        onlineFriends.map((friendId) =>
          this.redisService.get(createCacheKey(CacheKey.USER_CLIENT, friendId)),
        ),
      );
      const validSocketIds = socketIds.filter(Boolean);
      if (validSocketIds.length > 0) {
        this.server.to(validSocketIds).emit('friendStatus', {
          userId: status.userId,
          status: status.isOnline,
          lastOnline: status.lastOnline,
        });
      }
    }

    const statusString = JSON.stringify(status);
 
    for (const friendId of friends) {
      await this.redisService.setOverrideByUserId(multi, `online_friends:${friendId}`, statusString);
    }

    await multi.exec();
  }

  private async getUserId(client: Socket): Promise<Uuid | null> {
    
    const userId = (await this.redisService.get(
      createCacheKey(CacheKey.MSG_SOCKET_CONNECT, client.id)
    )) ;    
    if (!userId) {
      return null;
    }
    return userId as Uuid;
  }

  private async setUserOffline(userId: Uuid): Promise<void> {
    const clientId = await this.redisService.get(createCacheKey(CacheKey.USER_CLIENT, userId))
    const now = new Date();
    try {
      await this.userRepository.update(
        { id: userId },
        { lastOnline: now, isOnline: false }
      );
      this.notifyFriendStatus({ userId, isOnline: false, lastOnline: now });

      } catch (dbError) {
      console.error(`Failed to update database for user ${userId}:`, dbError);
    }
  }

  private async listenToRedisEvents() {
    const sub = new Redis();
    
    sub.psubscribe('__keyevent@0__:expired', (err, count) => {
      if (err) {
        console.error('❌ Redis Pub/Sub error:', err);
      } else {
        console.log(`✅ Subscribed to Redis Expiry Events! (${count})`);
      }
    });
    sub.on('pmessage', async (pattern, channel, key) => {  
          
      if (key.startsWith('poit-user-disconnect:')) {

        const parts = key.split(':'); 
        const userId = parts[1];


        await this.setOffline(userId);
      }
    });
  }

  private async setOffline(userId: string,) {
    await this.setUserOffline(userId as Uuid);

    console.log(`MSG-SOCKET-DISCONNECT::${userId}`);
  }
  private async handlePendingAcceptReq(client: Socket, userId: Uuid){
    const pendingRequests = await this.redisService.lrange(
      createCacheKey(CacheKey.UNRECEIVE_HANDLE_REQUEST_RELATION, userId),
      0, -1
    );
    
    for (const req of pendingRequests) {
      client.emit(SocketEmitKey.ACCEPT_RELATION_REQ, JSON.parse(req));
    }
    // Sau khi gửi, xoá các yêu cầu đã xử lý
    await this.redisService.del(createCacheKey(CacheKey.UNRECEIVE_HANDLE_REQUEST_RELATION, userId));
  }
}