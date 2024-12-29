import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { RoleEntity } from './entities/role.entity';
import { AuthProviderEntity } from './entities/auth-provider.entity';
import { BullModule } from '@nestjs/bullmq';
import { QueueName, QueuePrefix } from '@/constants/job.constant';
import { RelationEntity } from '../relationship/entities/relation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity,RoleEntity,AuthProviderEntity, RelationEntity]),
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
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
