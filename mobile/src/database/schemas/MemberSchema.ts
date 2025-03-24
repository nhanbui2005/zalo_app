// tables/members.ts
import { tableSchema, ColumnSchema } from '@nozbe/watermelondb';

export const memberConfig: {
  name: string;
  columns: ColumnSchema[];
} = {
  name: 'members',
  columns: [
    {name: '_id', type: 'string'},
    { name: 'role', type: 'string' },
    { name: 'user_id', type: 'string' },
    { name: 'room_id', type: 'string' },
    { name: 'msg_v_time', type: 'number', isOptional: true },
  ],
};

// Dùng cho appSchema
export const MemberSchema = tableSchema(memberConfig);