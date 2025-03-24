import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { RedisService } from '@/redis/redis.service';

@WebSocketGateway({ namespace: 'users' })
export class StatusGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private redisService: RedisService,
  ) {}

  async handleConnection(@ConnectedSocket() client: Socket) { 
    const userId = client.data.user.id;
    const onlineFriends = await this.redisService.smembers(`online_friends:${userId}`);

    //Gửi lại danh sách bạ đang online cho client
    client.emit('online_friends', onlineFriends);
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
  }
}
