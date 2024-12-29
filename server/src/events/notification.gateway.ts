import { EventEmitterKey } from '@/constants/event-emitter.constant';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Cache } from 'cache-manager';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173', // Địa chỉ ReactJS hoặc client của bạn
    credentials: true,              // Cho phép gửi cookie nếu cần
  },
}) // Không namespace để áp dụng toàn cục
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ){}

  @WebSocketServer()
  server: Server;

  async handleConnection(@ConnectedSocket() client: Socket) {
    console.log('connected');

    //lưu user đã online
   // await this.cacheManager.set('a',client.id)
    this.server.emit('connected',`Hello ${client.id}`)
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    console.log('disconected');
  }

  @OnEvent(EventEmitterKey.SENT_REQUEST_ADD_FRIEND)
  sendNotificationSentRequestAddFriend(data: any) {    
    const {to, payload} = data
    this.server.emit(to, payload);
  }

  @OnEvent(EventEmitterKey.HANDLE_REQUEST_ADD_FRIEND)
  handleNotificationSentRequestAddFriend(data: any) {    
    const {to, payload} = data
    this.server.emit(to, payload);
  }

  @SubscribeMessage('requestNotification')
  handleRequestNotification(client: any, payload: any) {
    client.emit('notification', { message: 'Your notification request is processed.' });
  }
}
