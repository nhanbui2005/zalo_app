import { ColumnSchema, tableSchema } from "@nozbe/watermelondb";

export const mediaConfig: {
  name: string;
  columns: ColumnSchema[] 
} = {
  name: 'medias',
  columns: [
    { name: '_id', type: 'string' },
    { name: 'url', type: 'string' },
    { name: 'public_id', type: 'string' },
    { name: 'format', type: 'string', isOptional: true },
    { name: 'bytes', type: 'number', isOptional: true },
    { name: 'width', type: 'number', isOptional: true },
    { name: 'height', type: 'number', isOptional: true },
    { name: 'duration', type: 'number', isOptional: true },
    { name: 'preview_url', type: 'string', isOptional: true },
    { name: 'original_name', type: 'string', isOptional: true },
    { name: 'mime_type', type: 'string', isOptional: true },
    { name: 'type', type: 'string', isOptional: true },
    { name: 'message_id', type: 'string', isOptional: true, isIndexed: true },
    { name: 'room_id', type: 'string', isOptional: true, isIndexed: true },
    { name: 'user_id', type: 'string', isOptional: true, isIndexed: true },
    { name: 'status', type: 'string', isOptional: true },
    { name: 'created_at', type: 'number' },
    { name: 'local_path', type: 'string' },

    { name: 'download_progress', type: 'number', isOptional: true },
    { name: 'error_message', type: 'string', isOptional: true },
  ]
};
export const MediaSchema = tableSchema(mediaConfig);