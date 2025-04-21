// LinkMetadataModel.ts
import { Model } from '@nozbe/watermelondb';
import { field, text, immutableRelation } from '@nozbe/watermelondb/decorators';
import MessageModel from './MessageModel';
import RoomModel from './RoomModel';

export enum LinkType {
  YOUTUBE = 'youtube',
  ARTICLE = 'article',
  OTHER = 'other', 
}

export default class LinkMetadataModel extends Model {
  static table = 'links';

  @text('_id') _id!: string;
  @text('type') type!: LinkType; // Loại link (youtube, article, other)
  @text('url') url!: string; // Link gốc
  @text('thumbnail') thumbnail?: string; // URL ảnh thumbnail (nếu có)
  @text('title') title?: string; // Tiêu đề (video, bài báo)
  @text('description') description?: string; // Mô tả ngắn (nếu có)
  @text('source') source?: string; // Nguồn (ví dụ: YouTube, tên domain của bài báo)
  @field('created_at') createdAt!: number; // Thời gian lưu metadata
  @text('message_id') messageId!: string; // Liên kết với tin nhắn
  @text('room_id') roomId!: string; // Liên kết với phòng chat

  @immutableRelation('messages', 'message_id') message!: MessageModel;
  @immutableRelation('chatrooms', 'room_id') room!: RoomModel;
}