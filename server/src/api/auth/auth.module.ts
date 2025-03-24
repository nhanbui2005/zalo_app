import { QueueName, QueuePrefix } from '@/constants/job.constant';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './strategy/google.strategy';
import { PassportModule } from '@nestjs/passport';
import { AuthProviderEntity } from '../user/entities/auth-provider.entity';
import { RoleEntity } from '../user/entities/role.entity';
import { RedisModule } from '@/redis/redis.module';
import { RedisService } from '@/redis/redis.service';

@Module({
  imports: [
    UserModule,
    RedisModule,
    PassportModule,
    TypeOrmModule.forFeature([UserEntity,AuthProviderEntity,RoleEntity]),
    JwtModule.register({}),
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
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, RedisService],
  exports:[AuthService]
})
export class AuthModule {}
