import { Module } from '@nestjs/common';
import { ChatRoomService } from './chat-room.service';
import { ChatRoomController } from './chat-room.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatRoomEntity } from './entities/chat-room.entity';
import { MemberEntity } from '../members/entities/member.entity';
import { MessageEntity } from '../message/entities/message.entity';
import { RedisModule } from '@/redis/redis.module';
import { UserModule } from '../user/user.module';

@Module({
  imports:[
    RedisModule,
    UserModule,
    TypeOrmModule.forFeature([
      ChatRoomEntity,
      MemberEntity,
      MessageEntity
    ]),
  ],
  controllers: [ChatRoomController],
  providers: [ChatRoomService],
  exports: [ChatRoomService]
})
export class ChatRoomModule {}
