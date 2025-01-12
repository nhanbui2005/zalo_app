import { Module } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';
import { BullModule } from '@nestjs/bullmq';
import { QueueName, QueuePrefix } from '@/constants/job.constant';
import { AuthModule } from '@/api/auth/auth.module';

@Module({
  imports:[
    BullModule.registerQueue({
      name: QueueName.EMAIL,
      prefix: QueuePrefix.AUTH,
      streams: {
        events: {
          maxLen: 1000,
        },
      },
    }),
    AuthModule,
  ],
  providers: [
    NotificationGateway,
  ],
})
export class EventsModule {}
