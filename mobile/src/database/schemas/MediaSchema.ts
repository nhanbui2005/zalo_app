import { tableSchema, ColumnSchema } from '@nozbe/watermelondb';

export const mediaConfig: {
name: string;
columns: ColumnSchema[] 
} = {
  name: 'medias',
  columns: [
    { name: '_id', type: 'string' },
    { name: 'room_id', type: 'string' },
    { name: 'msg_id', type: 'string' },
    { name: 'name', type: 'string' },
    { name: 'type', type: 'string' },
    { name: 'file_url', type: 'string' },
    { name: 'call_status', type: 'string', isOptional: true },
    { name: 'preview_image', type: 'string', isOptional: true },
    { name: 'duration', type: 'number', isOptional: true },
    { name: 'size', type: 'number', isOptional: true },
    { name: 'created_at', type: 'number' }
  ]
};
export const MediaSchema = tableSchema(mediaConfig);
