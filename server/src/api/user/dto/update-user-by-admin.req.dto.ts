import { Role } from '@/constants/entity.enum';
import {
  BooleanField,
  EnumField,
  StringField,
  StringFieldOptional,
} from '@/decorators/field.decorators';
import { lowerCaseTransformer } from '@/utils/transformers/lower-case.transformer';
import { Transform } from 'class-transformer';

export class UpdateUserByAdminReqDto {
  @StringField()
  @Transform(lowerCaseTransformer)
  username: string;

  @StringFieldOptional()
  image?: string;

  @BooleanField()
  isActive?: boolean

  @EnumField(()=>Role,{each: true})
  @StringField({each: true, enum: Role})
  roles: Role[]
}
