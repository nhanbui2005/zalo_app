import { Module } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';
import { BullModule } from '@nestjs/bullmq';
import { QueueName, QueuePrefix } from '@/constants/job.constant';

@Module({
  imports:[
    // BullModule.registerQueue({
    //   name: QueueName.EMAIL,
    //   prefix: QueuePrefix.AUTH,
    //   streams: {
    //     events: {
    //       maxLen: 1000,
    //     },
    //   },
    // }),
  ],
  providers: [
    NotificationGateway,
  ],
})
export class EventsModule {}
