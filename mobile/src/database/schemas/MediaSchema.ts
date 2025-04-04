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
    { name: 'url', type: 'string' },
    { name: 'local_path', type: 'string', isOptional: true },
    { name: 'status', type: 'string' },
    { name: 'call_status', type: 'string', isOptional: true },
    { name: 'preview_image', type: 'string', isOptional: true },
    { name: 'duration', type: 'number', isOptional: true },
    { name: 'size', type: 'number', isOptional: true },
    { name: 'download_progress', type: 'number' },
    { name: 'created_at', type: 'number' },
    { name: 'metadata', type: 'string' }
  ]
};
export const MediaSchema = tableSchema(mediaConfig);
