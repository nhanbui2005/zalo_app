import { Module } from '@nestjs/common';
import { RelationService } from './relation.service';
import { RelationController } from './relation.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { RelationEntity } from './entities/relation.entity';
import { ChatRoomModule } from '../chat-room/chat-room.module';
import { UserModule } from '../user/user.module';
import { RoleEntity } from '../user/entities/role.entity';
import { RedisModule } from '@/redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RelationEntity, UserEntity, RoleEntity]), 
    UserModule,
    ChatRoomModule,
    RedisModule
  ],
  controllers: [RelationController],
  providers: [RelationService], 
  exports: [RelationService],
})
export class RelationModule {}

