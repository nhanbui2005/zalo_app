import { EventEmitterKey } from '@/constants/event-emitter.constant';
import { OnEvent } from '@nestjs/event-emitter';
import { WebSocketGateway, WebSocketServer, SubscribeMessage } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway() // Không namespace để áp dụng toàn cục
export class NotificationGateway {
  @WebSocketServer()
  server: Server;

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
