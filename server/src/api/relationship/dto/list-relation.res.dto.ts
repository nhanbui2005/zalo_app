import {
  ClassField,
  StringField,
  StringFieldOptional,
} from '@/decorators/field.decorators';
import { Exclude, Expose } from 'class-transformer';

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
}
