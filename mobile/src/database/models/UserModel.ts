import { Model } from '@nozbe/watermelondb';
import { field, text } from '@nozbe/watermelondb/decorators';
import { RelationStatus } from '~/features/relation/dto/relation.dto.enum';

export default class UserModel extends Model {
  static table = 'users';

  @text('_id') _id!: string;
  @text('relation_status') relationStatus!: RelationStatus;
  @text('username') username!: string;
  @text('preferred_name') preferredName?: string;
  @text('avatar_url') avatarUrl!: string;
  @text('cover_url') coverUrl!: string;
  @text('gender') gender!: string;
  @text('email') email!: string;
  @field('dob') dob!: number;
  @text('bio') bio!: string;
  @field('updated_at') updatedAt!: number;

  @field('is_online') isOnline!: boolean;
  @field('last_online') lastOnline!: number;
}