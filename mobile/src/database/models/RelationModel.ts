// models/Relation.ts
import { Model } from '@nozbe/watermelondb';
import { field, immutableRelation, relation, text } from '@nozbe/watermelondb/decorators';
import UserModel from './UserModel';
import { RelationStatus } from '~/features/relation/dto/relation.dto.enum';

export default class Relation extends Model {
  static table = 'relation';
  @text('_id') _id!: string;
  @text('requester_id') requesterId!: string;
  @text('handler_id') handlerId!: string;
  @text('status') status!: RelationStatus;
  @field('created_at') createdAt!: number;

  @immutableRelation('users', 'requester_id') requester!: UserModel;
  @immutableRelation('users', 'handler_id') handler!: UserModel;

}