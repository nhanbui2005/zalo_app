// redis.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import redisConfig from '@/redis/config/redis.config'; 
import { RedisService } from './redis.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [redisConfig],
    }),
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}