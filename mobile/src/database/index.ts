// database.ts
import {Database} from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import {databaseSchema} from './schemas/_index';
import UserModel from './models/UserModel';
import MemberModel from './models/MemberModel';
import MessageModel from './models/MessageModel';
import RoomModel from './models/RoomModel';
import EmojiModel from './models/EmojiModel';

const adapter = new SQLiteAdapter({
  schema: databaseSchema,
  // migrations: migrations,
  dbName: 'lazo',
  // jsi: true, // Nếu dùng JSI
  onSetUpError: error => {
    console.log('Error setting up database:', error);
  }
});

export const database = new Database({
  adapter,
  modelClasses: [UserModel, MemberModel, MessageModel, RoomModel, EmojiModel],
});
