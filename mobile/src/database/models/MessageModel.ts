import { Model, Query } from '@nozbe/watermelondb';
import { children, field, immutableRelation, text } from '@nozbe/watermelondb/decorators';
import { MessageContentType, MessageViewStatus } from '~/features/message/dto/message.enum';
import RoomModel from './RoomModel';
import MemberModel from './MemberModel';
import EmojiModel from './EmojiModel';

export default class MessageModel extends Model {
  static table = 'messages';
  @text('_id') _id!: string;

  @text('content') content!: string;
  @text('type') type!: MessageContentType; 
  @text('status') status!: MessageViewStatus;
  @field('revoked') revoked!: boolean;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  
  @text('sender_id') senderId?: string;
  @text('room_id') roomId!: string;
  @text('reply_message_id') replyMessageId?: string;

  // Quan hệ với ChatRoom
  @immutableRelation('chat_rooms', 'room_id') room!: RoomModel;
  
  // Quan hệ với Member (người gửi)
  @immutableRelation('members', 'sender_id') sender!: MemberModel ;

  // Tin nhắn được reply (dùng query để lấy danh sách replies)
  @immutableRelation('messages', 'reply_message_id') replyMessage?: MessageModel;

  // Quan hệ với EmojiModel (danh sách emoji của tin nhắn)
  @children('emojis') emojis!: Query<EmojiModel>;
}