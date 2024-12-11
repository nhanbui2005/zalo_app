import { IsNotEmpty, IsString } from 'class-validator';
import { v2 as cloudinary } from 'cloudinary';

class EnvironmentVariablesValidator {
  @IsString()
  @IsNotEmpty()
  CLOUDINARY_NAME: string;

  @IsString()
  @IsNotEmpty()
  CLOUDINARY_API_KEY: string;

  @IsString()
  @IsNotEmpty()
  CLOUDINARY_API_SECRET: string;

}

export const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  useFactory: () => {
    return cloudinary.config({
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
  },
};
