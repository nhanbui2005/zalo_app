import { EventEmitterKey } from '@/constants/event-emitter.constant';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, UseGuards } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect, WsException } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Cache } from 'cache-manager';
import { AuthService } from '@/api/auth/auth.service';
import { JwtPayloadType } from '@/api/auth/types/jwt-payload.type';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173', // Địa chỉ ReactJS hoặc client của bạn
    credentials: true,         
    allowedHeaders: ["Custom-Header", "Authorization"],     // Cho phép gửi cookie nếu cần
  },
}) // Không namespace để áp dụng toàn cục
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly authService: AuthService,
  ){}

  @WebSocketServer()
  server: Server;

  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      const accessToken = this.extractTokenFromHeader(client)       
      const user: JwtPayloadType = await this.authService.verifyAccessToken(accessToken)
      this.cacheManager.set(`connected:${user.id}`,user.id)
    } catch (error) {
      this.server.emit('error','hihi') 
    }
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    try {
      const accessToken = this.extractTokenFromHeader(client)
      const user: JwtPayloadType = await this.authService.verifyAccessToken(accessToken)    
      this.cacheManager.del(`connected:${user.id}`)
    } catch (error) {
      this.server.emit('error','hihi')
    }
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

  private extractTokenFromHeader(request: Socket): string | undefined {
    const accessToken = request.handshake.auth.token || request.handshake.headers.authorization
    const [type, token] = accessToken.trim()?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
