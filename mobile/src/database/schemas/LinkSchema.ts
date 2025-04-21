import {ColumnSchema, tableSchema} from '@nozbe/watermelondb';

export const linkConfig: {
  name: string;
  columns: ColumnSchema[];
} = {
  name: 'links',
  columns: [
    {name: '_id', type: 'string'},
    {name: 'type', type: 'string'},
    {name: 'url', type: 'string'},
    {name: 'thumbnail', type: 'string', isOptional: true},
    {name: 'title', type: 'string', isOptional: true},
    {name: 'description', type: 'string', isOptional: true},
    {name: 'source', type: 'string', isOptional: true},
    {name: 'created_at', type: 'number'},
    {name: 'message_id', type: 'string', isIndexed: true},
    {name: 'room_id', type: 'string', isIndexed: true},
  ],
};
export const LinkSchema = tableSchema(linkConfig);
