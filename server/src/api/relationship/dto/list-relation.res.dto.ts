import { RoomResDto } from '@/api/chat-room/dto/room.res.dto';
import { UserResDto } from '@/api/user/dto/user.res.dto';
import {
  ClassField,
  StringField,
  StringFieldOptional,
} from '@/decorators/field.decorators';
import { Optional } from '@nestjs/common';
import { Exclude, Expose } from 'class-transformer';

// Định nghĩa class RoomDto
@Exclude()
export class RoomDto {
  @StringField()
  @Expose()
  id: string;

  @StringField()
  @Expose()
  name: string;

  @ClassField(() => Date)
  @Expose()
  createdAt: Date;
}

// Cập nhật RelationResDto để bao gồm RoomDto
@Exclude()
export class RelationResDto {
  @StringField()
  @Expose()
  id: string;

  @StringField()
  @Expose()
  requesterId: string;

  @StringField()
  @Expose()
  handlerId: string;

  @StringFieldOptional()
  @Expose()
  status: string;

  @ClassField(() => Date)
  @Expose()
  createdAt: Date;

  @ClassField(() => Date)
  @Expose()
  updatedAt: Date;

  @Optional()
  @ClassField(() => RoomResDto) 
  @Expose()
  room?: RoomResDto;

  @Optional()
  @ClassField(() => UserResDto)
  @Expose()
  user?: UserResDto;
}