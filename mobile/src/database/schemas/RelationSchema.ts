import { tableSchema, ColumnSchema } from '@nozbe/watermelondb';

export const relationConfig: {
  name: string;
  columns: ColumnSchema[];
} = {
  name: 'relations',
  columns: [
    {name: '_id', type: 'string'},
    { name: 'requester_id', type: 'string' }, 
    { name: 'handler_id', type: 'string' }, 
    { name: 'status', type: 'string' },
    { name: 'created_at', type: 'number'},
  ],
};

export const RelationSchema = tableSchema(relationConfig);