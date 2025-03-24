// tables/rooms.ts
import { tableSchema, ColumnSchema } from '@nozbe/watermelondb';

export const roomConfig: {
  name: string;
  columns: ColumnSchema[];
} = {
  name: 'rooms',
  columns: [
    {name: '_id', type: 'string'},
    { name: 'type', type: 'string' },
    { name: 'group_name', type: 'string' },
    { name: 'group_avatar', type: 'string' },
    { name: 'unread_count', type: 'number' },
    { name: 'member_count', type: 'number' },
    { name: 'updated_at', type: 'number'},
    
    { name: 'last_msg_id', type: 'string' },
    { name: 'last_msg_content', type: 'string' },
    { name: 'last_msg_revoked', type: 'boolean' },
    { name: 'last_msg_type', type: 'string' },
    { name: 'last_msg_sender_name', type: 'string' },
    { name: 'last_msg_status', type: 'string' },
    { name: 'last_msg_created_at', type: 'number' },
  ],
};

export const RoomSchema = tableSchema(roomConfig);