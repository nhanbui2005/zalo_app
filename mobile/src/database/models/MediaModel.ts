import { Model } from '@nozbe/watermelondb';
import { field, text, immutableRelation } from '@nozbe/watermelondb/decorators';
import UserModel from './UserModel';
import RoomModel from './RoomModel';
import MessageModel from './MessageModel';
import { MediaStatus } from '../types/media.types';

export default class MediaModel extends Model {
  static table = 'medias';
  @text('_id') _id!: string;
  @text('url') url!: string;
  @text('public_id') publicId!: string;
  @text('format') format!: string;
  @field('bytes') bytes!: number;
  @field('width') width!: number;
  @field('height') height!: number;
  @field('duration') duration!: number;
  @text('preview_url') previewUrl!: string;
  @text('original_name') originalName!: string;
  @text('mime_type') mimeType!: string;
  @text('type') type?: string;
  @text('message_id') messageId!: string;
  @text('room_id') roomId!: string;
  @text('status') status!: MediaStatus;
  @field('created_at') createdAt!: number;
  @field('download_progress') downloadProgress!: number; // Thêm trường tiến trình
  @text('local_path') localPath!: string; // Thêm đường dẫn file
  @text('error_message') errorMessage!: string | null; // Thêm thông báo lỗi

  @immutableRelation('messages', 'message_id') message!: MessageModel;
  @immutableRelation('users', 'user_id') user!: UserModel;
  @immutableRelation('chatrooms', 'room_id') room!: RoomModel;
}