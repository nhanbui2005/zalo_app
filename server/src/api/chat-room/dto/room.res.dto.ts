import { MessageResDto } from '@/api/message/dto/message.res.dto';
import { MemberResDto } from '@/api/relationship/dto/member.res.dto';
import { UserResDto } from '@/api/user/dto/user.res.dto';
import { WrapperType } from '@/common/types/types';
import { RoomType } from '@/constants/entity.enum';
import {
  ClassField,
  ClassFieldOptional,
  EnumField,
  StringField,
} from '@/decorators/field.decorators';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class RoomResDto {
  @StringField()
  @Expose()
  id: string;

  @StringField()
  @Expose()
  roomAvatarUrl: string;

  @StringField()
  @Expose()
  roomName: string;

  @EnumField(()=>RoomType)
  @Expose()
  type: RoomType;

  @ClassField(()=> MemberResDto)
  @Expose()
  members: WrapperType<MemberResDto[]>;

  @ClassFieldOptional(()=> MessageResDto)
  @Expose()
  lastMsg: WrapperType<MessageResDto[]>;

  @ClassFieldOptional(()=> MessageResDto)
  @Expose()
  messages: WrapperType<MessageResDto[]>;

  @ClassFieldOptional(()=> UserResDto)
  @Expose()
  user: WrapperType<UserResDto[]>;
}
