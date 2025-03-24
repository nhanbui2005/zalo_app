import { Model } from '@nozbe/watermelondb';
import { children, field, text } from '@nozbe/watermelondb/decorators';
import { RoomTypeEnum } from '~/features/room/dto/room.enum';
import MemberModel from './MemberModel';
import MessageModel from './MessageModel';

export default class RoomModel extends Model {
  static table = 'rooms';

  // Các trường cơ bản của phòng
  @text('_id') _id!: string;
  @text('type') type!: RoomTypeEnum;
  @text('group_name') roomName!: string;
  @text('group_avatar') roomAvatar!: string;
  @field('member_count') memberCount!: number;
  @field('unread_count') unreadCount!: number;
  @field('updated_at') updatedAt!: number;

  @text('last_msg_content') lastMessageContent!: string;
  @text('last_msg_type') lastMessageType!: string;
  @field('last_msg_revoked') lastMessageRevoked!: boolean;
  @text('last_msg_sender_name') lastMessageSenderName!: string;
  @text('last_msg_status') lastMessageStatus!: string;
  @field('last_msg_created_at') lastMessageCreatedAt!: number;

  @children('members') members!: MemberModel[];
  @children('messages') messages!: MessageModel[];
}