import { Module } from '@nestjs/common';
import { RelationService } from './relation.service';
import { RelationController } from './relation.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { RelationEntity } from './entities/relation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RelationEntity ,UserEntity]),
  ],
  controllers: [RelationController],
  providers: [RelationService],
})
export class RelationModule {}
