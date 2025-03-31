import { appSchema } from '@nozbe/watermelondb';
import { UserSchema } from './UserSchema';
import { MessageSchema } from './MessageSchema';
import { MemberSchema } from './MemberSchema';
import { RoomSchema } from './RooomSchema';
import { EmojiSchema } from './EmojiSchema';

export const databaseSchema = appSchema({
  version: 1,
  tables: [
    UserSchema,
    RoomSchema,
    MessageSchema,
    MemberSchema,
    EmojiSchema
  ],
});