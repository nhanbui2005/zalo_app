import { Uuid } from '@/common/types/common.type';
import {
  UUIDField,
} from '@/decorators/field.decorators';

export class RevokeRequestToAddFriendReqDto {
  @UUIDField()
  relationId: Uuid
}
