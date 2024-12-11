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
  
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
  
  }

  @OnEvent(EventEmitterKey.NEW_MESSAGE)
  async newMessage(data: any) {
    const { members } = data

    //check clients online or offline
    let onlineClients = []
    let offineClients = []
    //handle here...

    //hadle online clients...

    //hadle offine clients...
  }
}
