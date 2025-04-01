import { Model } from '@nozbe/watermelondb';
import { field, text, immutableRelation } from '@nozbe/watermelondb/decorators';
import UserModel from './UserModel';
import RoomModel from './RoomModel';

export default class FileModel extends Model {
  static table = 'files';

  @text('_id') _id!: string; 
  @text('msg_id') msgId: string | null = null;
  @text('image') image: string | null = null;
  @text('file_name') fileName!: string; 
  @text('file_url') fileUrl!: string; 
  @field('size') size!: number; 
  @field('created_at') createdAt!: number;

  @immutableRelation('users', 'user_id') user!: UserModel;
  @immutableRelation('chatrooms', 'room_id') room!: RoomModel; 
}
