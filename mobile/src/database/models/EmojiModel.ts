// models/Emoji.ts
import { Model } from '@nozbe/watermelondb';
import { field, text } from '@nozbe/watermelondb/decorators';

export default class EmojiModel extends Model {
  static table = 'emojis';

  @text('_id') _id!: string;
  @text('member_id') memberId!: string;
  @text('message_id') messageId!: string;
  @text('content') content!: string;
  @field('created_at') createdAt!: number;
}