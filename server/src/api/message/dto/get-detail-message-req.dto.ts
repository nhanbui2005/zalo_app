import { StringField } from '@/decorators/field.decorators';

export class DetailMessageReqDto {
  @StringField()
  messageCraetedAt!: number
}
