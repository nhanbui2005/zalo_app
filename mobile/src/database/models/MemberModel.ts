import { Model } from '@nozbe/watermelondb';
import { field, date, immutableRelation, text } from '@nozbe/watermelondb/decorators';
import UserModel from './UserModel';
import RoomModel from './RoomModel';

export default class MemberModel extends Model {
  static table = 'members';
  @text('_id') _id!: string;
  @text('role') role!: string;
  @text('user_id') userId!: string;
  @text('room_id') roomId!: string;
  @field('msg_v_time') msgVTime?: number;

  @immutableRelation('users', 'user_id') user!: UserModel;
  @immutableRelation('chatrooms', 'room_id') room!: RoomModel;
}