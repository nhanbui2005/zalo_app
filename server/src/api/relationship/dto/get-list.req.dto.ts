import { Uuid } from '@/common/types/common.type';
import {
  EnumField,
} from '@/decorators/field.decorators';

enum GetRelationsType{
  AWAIT_ACCEPT = 'await',
  SEND ='send'
}

export class GetListRelationReqDto {
  @EnumField(()=> GetRelationsType)
  type: Uuid
}
