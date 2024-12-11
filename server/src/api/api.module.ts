import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { HomeModule } from './home/home.module';
import { UserModule } from './user/user.module';
import { MessageModule } from './message/message.module';
import { RelationModule } from './relationship/relation.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    UserModule,
    AuthModule,
    HomeModule,
    MessageModule,
    RelationModule,
    CloudinaryModule,
    UploadModule
  ],
})
export class ApiModule {}
