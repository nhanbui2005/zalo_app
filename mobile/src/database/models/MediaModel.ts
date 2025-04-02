import { Model } from '@nozbe/watermelondb';
import { field, text, immutableRelation } from '@nozbe/watermelondb/decorators';
import UserModel from './UserModel';
import RoomModel from './RoomModel';

export default class MediaModel extends Model {
  static table = 'media';

  @text('_id') _id!: string; 
  @text('room_id') roomId!: string ;
  @text('msg_id') msgId!: string;
  @text('name') name!: string; 
  @text('file_url') fileUrl!: string; 
  @text('preview_image') image: string | null = null;
  @field('duration') duration: number | null = null;
  @field('size') size: number  | null = null; 
  @field('created_at') createdAt!: number;

  @immutableRelation('users', 'user_id') user!: UserModel;
  @immutableRelation('chatrooms', 'room_id') room!: RoomModel; 
}
