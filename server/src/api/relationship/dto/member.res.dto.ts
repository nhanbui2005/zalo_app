import { RoomResDto } from '@/api/chat-room/dto/room.res.dto';
import { UserResDto } from '@/api/user/dto/user.res.dto';
import { Uuid } from '@/common/types/common.type';
import { WrapperType } from '@/common/types/types';
import { MemberRole, MessageContentType, MessageViewStatus } from '@/constants/entity.enum';
import {
  BooleanField,
  ClassField,
  EnumField,
  StringField,
  StringFieldOptional,
} from '@/decorators/field.decorators';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class MemberResDto {
  @StringField()
  @Expose()
  id: string;

  @EnumField(()=>MemberRole)
  @Expose()
  role: MemberRole;

  @ClassField(()=>UserResDto)
  @Expose()
  user: UserResDto;

  @ClassField(()=>RoomResDto)
  @Expose()
  room: WrapperType<RoomResDto>;

}
