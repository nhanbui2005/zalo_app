import { Uuid } from '@/common/types/common.type';
import { RelationStatus } from '@/constants/entity-enum/relation.enum';
import {
  EnumFieldOptional,
} from '@/decorators/field.decorators';

enum GetRelationsType{
  AWAIT_ACCEPT = 'await',
  SEND ='send'
}

export class GetListRelationReqDto {
  @EnumFieldOptional(()=> GetRelationsType)
  type: Uuid

  @EnumFieldOptional(()=> RelationStatus)
  status: RelationStatus
}
