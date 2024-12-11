import {
  StringField,
} from '@/decorators/field.decorators';

export class SendRequestToAddFriendReqDto {
  @StringField()
  receiverId: string
}
