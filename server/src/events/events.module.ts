import { forwardRef, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueName, QueuePrefix } from '@/constants/job.constant';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageEntity } from '@/api/message/entities/message.entity';
import { RedisModule } from '@/redis/redis.module';
import { RelationModule } from '@/api/relationship/relation.module';
import { ChatRoomModule } from '@/api/chat-room/chat-room.module';
import { MessageModule } from '@/api/message/message.module';
import { NotificationsGateway } from './gateways/notification.gateway';
import { StatusGateway } from './gateways/status.gateway';
import { WsAuthService } from './events.service'; // Nếu có
import { UserModule } from '@/api/user/user.module';
import { AuthModule } from '@/api/auth/auth.module';
import { MessagesGateway } from './gateways/message.gateway';

@Module({
  imports: [
    RedisModule,
    AuthModule,
    RelationModule,
    ChatRoomModule,
    UserModule,
    forwardRef(() => MessageModule),
    TypeOrmModule.forFeature([MessageEntity]),
    BullModule.registerQueue({
      name: QueueName.EMAIL,
      prefix: QueuePrefix.AUTH,
      streams: {
        events: {
          maxLen: 1000,
        },
      },
    }),
  ],
  providers: [
    MessagesGateway,
    NotificationsGateway,
    StatusGateway,
    WsAuthService
  ],
  exports: [
    MessagesGateway,
    NotificationsGateway,
    StatusGateway,
  ],
})
export class EventsModule {}