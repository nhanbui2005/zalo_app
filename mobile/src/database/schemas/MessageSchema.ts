// tables/messages.ts
import { tableSchema, ColumnSchema } from '@nozbe/watermelondb';

export const messageConfig: {
  name: string;
  columns: ColumnSchema[];
} = {
  name: 'messages',
  columns: [
    {name: '_id', type: 'string'},
    { name: 'content', type: 'string' },
    { name: 'sender_id', type: 'string' },
    { name: 'room_id', type: 'string' },
    { name: 'type', type: 'string' },
    { name: 'status', type: 'boolean' },
    { name: 'reply_message_id', type: 'string', isOptional: true },
    { name: 'revoked', type: 'boolean' },
    { name: 'emojis', type: 'string', isOptional: true },
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number'}
  ],
};

export const MessageSchema = tableSchema(messageConfig);