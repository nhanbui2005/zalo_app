import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { AuthService } from '@/api/auth/auth.service';
import { RedisService } from '@/redis/redis.service';
import { Uuid } from '@/common/types/common.type';
import { JwtPayloadType } from '@/api/auth/types/jwt-payload.type';
import { CacheKey } from '@/constants/cache.constant';
import { createCacheKey } from '@/utils/cache.util';

@Injectable()
export class WsAuthService {
  private initializationMap = new Map<string, Promise<any>>();

  constructor(
    private authService: AuthService,
    private redisService: RedisService,
  ) {}

  onClientConnect(socket: Socket) {
    this.initializationMap.set(socket.id, this.initialize(socket));
  }

  async finishInitialization(socket: Socket): Promise<any> {
    await this.initializationMap.get(socket.id);
  }

  private async initialize(client: Socket): Promise<any> {
    try {
      const accessToken = this.extractTokenFromHeader(client);
      let userId: Uuid;

      const { id } : JwtPayloadType = await this.authService.verifyAccessToken(accessToken);
      const pendingMessages = await this.redisService.get(createCacheKey(CacheKey.UNRECEIVE_MSG, id));
      
      userId = id as Uuid;

      await Promise.all([
        this.redisService.set(createCacheKey(CacheKey.MSG_SOCKET_CONNECT, client.id), id),
        this.redisService.set(createCacheKey(CacheKey.USER_CLIENT, id), client.id),
      ]);

      // Gán dữ liệu cơ bản vào client.data
      client.data.user = { pendingMessages, id: userId };
    
    } catch (error) {
      client.disconnect()
      throw error;
    } finally {
      this.initializationMap.delete(client.id);
    }
  }

  private extractTokenFromHeader(socket: Socket): string {
    const token = socket.handshake.auth.token || socket.handshake.headers['authorization'];
    if (!token) throw new Error('No token provided');
    return token.replace('Bearer ', '');
  }
}