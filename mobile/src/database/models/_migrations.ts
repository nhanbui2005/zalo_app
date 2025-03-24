import { schemaMigrations, createTable } from '@nozbe/watermelondb/Schema/migrations'
import { messageConfig, MessageSchema } from '../schemas/MessageSchema'
import { memberConfig } from '../schemas/MemberSchema'
import { userConfig } from '../schemas/UserSchema'
import { roomConfig } from '../schemas/RooomSchema'

export default schemaMigrations({
  migrations: [
    {
      // ⚠️ Set this to a number one larger than the current schema version
      toVersion: 2,
      steps: [
        // See "Migrations API" for more details
        createTable(userConfig),
        createTable(memberConfig),  
        createTable(roomConfig),
        createTable(messageConfig),
      ],
    },
  ],
})