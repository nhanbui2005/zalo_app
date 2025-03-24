import { Injectable } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { RoomResDto } from '../chat-room/dto/room.res.dto';
import { UserResDto } from '../user/dto/user.res.dto';
import { RelationStatus } from '@/constants/entity-enum/relation.enum';
import { SocketEmitKey } from '@/constants/socket-emit.constanct';
import { EventEmitterKey } from '@/constants/event-emitter.constant';
import { OnEvent } from '@nestjs/event-emitter';
import { createCacheKey } from '@/utils/cache.util';
import { CacheKey } from '@/constants/cache.constant';
import { RedisService } from '@/redis/redis.service';

@Injectable()
@WebSocketGateway({namespace:'/relation'})
export class EventsGateway {
  @WebSocketServer()
  server: Server;

   constructor(
      private readonly redisService: RedisService, 
    ) {}

  @OnEvent(EventEmitterKey.UPDATE_RELATION_REQ)
  async handleRelationUpdate(
    userId: string,
    relationStatus: RelationStatus,
    room?: RoomResDto,
    user?: UserResDto,
  ): Promise<void> {
    try {
        const userKeySocket = createCacheKey(CacheKey.USER_CLIENT, userId)
        const targetSocketId = await this.redisService.get(userKeySocket);

        const payload = {
            userId,
            relationStatus,
            room,
            user,
            updatedAt: new Date().toISOString(), 
        };

        if (targetSocketId) {
          // User online, gửi thông báo ngay
          this.server.to(targetSocketId).emit(SocketEmitKey.RELATION_UPDATED, payload);
          console.log(`Sent relation update to socketId ${targetSocketId} for user ${userId}`);
        } else {
          // User không online, lưu vào Redis
          const pendingKey = createCacheKey(CacheKey.UNRECEIVE_HANDLE_REQUEST_RELATION, userId);
          await this.redisService.lpush(pendingKey, JSON.stringify(payload));
        }

    } catch (error) {
      console.error('Error handling relation update:', error);
      throw new Error(`Failed to emit relation update: ${error.message}`);
    }
  }
}