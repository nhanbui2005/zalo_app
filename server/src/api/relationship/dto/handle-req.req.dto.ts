import { Uuid } from '@/common/types/common.type';
import {
  EnumField,
  UUIDField,
} from '@/decorators/field.decorators';

export enum ActionHanleRequestRelation{
  ACCEPT = 'accept',
  REJECT = 'reject',
  REVOKE = 'revoke',
}

export class HandleRequestToAddFriendReqDto {
  @UUIDField()
  relationId: Uuid

  @EnumField(()=> ActionHanleRequestRelation)
  action: ActionHanleRequestRelation
}
