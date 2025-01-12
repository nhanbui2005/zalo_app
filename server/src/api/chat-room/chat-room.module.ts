import { Module } from '@nestjs/common';
import { ChatRoomService } from './chat-room.service';
import { ChatRoomController } from './chat-room.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatRoomEntity } from '../message/entities/chat-room.entity';
import { MemberEntity } from '../message/entities/member.entity';

@Module({
  imports:[
    TypeOrmModule.forFeature([
      ChatRoomEntity,
      MemberEntity
    ]),
  ],
  controllers: [ChatRoomController],
  providers: [ChatRoomService],
})
export class ChatRoomModule {}
