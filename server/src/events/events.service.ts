import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class WsAuthService {
  private initializationMap = new Map<string, Promise<any>>();

  onClientConnect(socket: Socket) {
    this.initializationMap.set(socket.id, this.initialize(socket));
  }

  async finishInitialization(socket: Socket): Promise<any> {
    await this.initializationMap.get(socket.id);
  }

  private async initialize(socket: Socket): Promise<any> {
    // asynchronously get user data
    const user = await new Promise((resolve) =>
      setTimeout(() => resolve({ id: 1234, hasPower: true, foo: 'bar' }), 2000),
    );

    // store result to socket data
    socket.data.user = user;

    this.initializationMap.delete(socket.id);
  }
}