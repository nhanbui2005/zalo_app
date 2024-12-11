import { Gender, Role } from '@/constants/entity.enum';
import {
  DateFieldOptional,
  EmailField,
  EnumField,
  EnumFieldOptional,
  StringField,
  StringFieldOptional,
} from '@/decorators/field.decorators';
import { lowerCaseTransformer } from '@/utils/transformers/lower-case.transformer';
import { Transform } from 'class-transformer';

export class CreateUserReqDto {
  @StringField()
  @Transform(lowerCaseTransformer)
  username: string;

  @EmailField()
  email: string;

  @StringFieldOptional()
  avatarUrl?: string;

  @StringFieldOptional()
  avatarPid?: string;

  @StringFieldOptional()
  bio?: string;

  @EnumFieldOptional(()=>Gender)
  gender?: Gender;

  @DateFieldOptional()
  dob?: Date

  @EnumField(()=>Role,{each: true})
  @StringField({each: true, enum: Role})
  roles: Role[]
}
