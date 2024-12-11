import { Module } from '@nestjs/common';
import { ChatRoomModule } from './api/chat-room/chat-room.module';
//import { SocketIoModule } from './socket-io/socket-io.module';
import { EventsModule } from './events/events.module';
import { UploadModule } from './api/upload/upload.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import generateModulesSet from './utils/modules-set';


@Module({
  imports: generateModulesSet()
})
export class AppModule {}
