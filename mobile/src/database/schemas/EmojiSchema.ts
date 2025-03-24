
// tables/emojis.ts
import { tableSchema, ColumnSchema } from '@nozbe/watermelondb';

export const emojiConfig: {
  name: string;
  columns: ColumnSchema[];
} = {
  name: 'emojis',
  columns: [
    {name: '_id', type: 'string'},
    { name: 'member_id', type: 'string' },
    { name: 'message_id', type: 'string'},
    { name: 'content', type: 'string' },
    { name: 'created_at', type: 'number' },
  ],
};

// Dùng cho appSchema
export const EmojiSchema = tableSchema(emojiConfig);