// tables/users.ts
import { tableSchema, ColumnSchema } from '@nozbe/watermelondb';

// Định nghĩa cấu hình với kiểu rõ ràng
export const userConfig: {
  name: string;
  columns: ColumnSchema[];
} = {
  name: 'users',
  columns: [
    {name: '_id', type: 'string'},
    { name: 'relation_status', type: 'string' },
    { name: 'username', type: 'string' },
    { name: 'preferred_name', type: 'string' },
    { name: 'avatar_url', type: 'string' },
    { name: 'avatar_pid', type: 'string' },
    { name: 'cover_url', type: 'string' },
    { name: 'cover_pid', type: 'string' },
    { name: 'gender', type: 'string' },
    { name: 'email', type: 'string' }, 
    { name: 'dob', type: 'number' },   
    { name: 'bio', type: 'string' },   
    { name: 'is_online', type: 'boolean' },
    { name: 'last_online', type: 'number' },
    { name: 'updated_at', type: 'number' },
  ],
};

// Dùng cho appSchema
export const UserSchema = tableSchema(userConfig);