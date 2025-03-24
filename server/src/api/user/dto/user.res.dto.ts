import {
  BooleanField,
  ClassField,
  DateField,
  EnumField,
  StringField,
  StringFieldOptional,
} from '@/decorators/field.decorators';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserResDto {
  @StringField()
  @Expose()
  id: string;

  @StringField()
  @Expose()
  username: string;

  @StringField()
  @Expose()
  email: string;

  @StringField()
  @Expose()
  gender: string;

  @DateField()
  @Expose()
  dob: string;

  @StringFieldOptional()
  @Expose()
  bio?: string;

  @StringField()
  @Expose()
  avatarUrl: string;

  @StringField()
  @Expose()
  avatarPid: string;

  @StringField()
  @Expose()
  coverUrl: string;

  @StringField()
  @Expose()
  coverPid: string;

  @ClassField(() => Date)
  @Expose()
  createdAt: Date;

  @ClassField(() => Date)
  @Expose()
  updatedAt: Date;
}
