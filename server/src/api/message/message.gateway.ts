import { OnEvent } from '@nestjs/event-emitter';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { Repository } from 'typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { EventEmitterKey } from '@/constants/event-emitter.constant';
import { createEventKey } from '@/utils/socket.util';
import { EventKey } from '@/constants/event.constants';

@Injectable()
@WebSocketGateway({ namespace: '/message' })
export class MessageGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly authService: AuthService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>
  ) {}

  async handleConnection(@ConnectedSocket() client: Socket) {
    //lưu user đã online
   // await this.cacheManager.set('a',client.id)
    this.server.emit('connected',`Hello3 ${client.id}`)
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
  
  }

  @OnEvent(EventEmitterKey.NEW_MESSAGE)
  async newMessage(data: any) {
    console.log('dô',data);
    
    const { members } = data

    await Promise.all(await members.map( async (member) => {
      this.server.emit(
        createEventKey(EventKey.NEW_MESSAGE, member.userId),
        data
      )
    }))

    //check clients online or offline
    let onlineClients = []
    let offineClients = []
    //handle here...

    //hadle online clients...

    //hadle offine clients...
  }
}
