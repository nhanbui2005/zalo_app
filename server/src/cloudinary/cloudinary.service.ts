import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

// Định nghĩa interface cho response của Cloudinary
export interface CloudinaryResponse extends UploadApiResponse {}

@Injectable()
export class CloudinaryService {
  constructor() {
    // Cấu hình Cloudinary (nên để trong file config riêng)
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  // Upload file PDF (raw) và thumbnail
  async uploadFile(file: Express.Multer.File): Promise<CloudinaryResponse> {
    // Determine the resource_type for file based on mime type
    let resourceType: 'image' | 'raw' | 'video'; // Allow 'video' type
  
    if (file.mimetype === 'application/pdf') {
      resourceType = 'raw';
    } else if (file.mimetype.includes('video')) {
      resourceType = 'video'; // Use 'video' for video files
    } else {
      resourceType = 'image'; // Default to 'image' for all other cases
    }
  
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'media',
          resource_type: resourceType, // This can now correctly be 'video'
          access_mode: 'public',
          upload_preset: 'buihuunhan',
          timeout: 60000,
          ...(resourceType === 'video' && {
            quality: 'auto', 
            video_codec: 'auto', 
          }),
        },
        (error, result) => {
          if (error) return reject(new BadRequestException(`Upload failed: ${error.message}`));
          if (!result) return reject(new BadRequestException('No response from Cloudinary'));
          resolve(result);
        },
      );
  
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }
  

  // Upload thumbnail cho file PDF
  async uploadThumbnail(file: Express.Multer.File): Promise<CloudinaryResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'media',
          resource_type: 'image', // Đảm bảo thumbnail là hình ảnh
          access_mode: 'public',
          upload_preset: 'buihuunhan',
          timeout: 60000,
        },
        (error, result) => {
          if (error) return reject(new BadRequestException(`Upload thumbnail thất bại: ${error.message}`));
          if (!result) return reject(new BadRequestException('Không nhận được phản hồi từ Cloudinary khi upload thumbnail'));
          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  // Upload cả file PDF và thumbnail song song
  private ensureJpgExtension(url: string): string {
    if (!url) return url;

    // Nếu URL đã có đuôi .jpg hoặc .jpeg, giữ nguyên
    if (url.match(/\.(jpg|jpeg)$/i)) {
      return url;
    }

    // Nếu URL có đuôi khác (ví dụ: .pdf hoặc không có đuôi), thay/add .jpg
    if (url.match(/\.\w+$/)) {
      return url.replace(/\.\w+$/i, '.jpg');
    }

    // Nếu không có đuôi, thêm .jpg
    return url + '.jpg';
  }

  async uploadFiles(files: Express.Multer.File[] | Express.Multer.File): Promise<CloudinaryResponse[]> {
    const fileArray = Array.isArray(files) ? files : [files];

    if (!fileArray || fileArray.length === 0) {
      throw new BadRequestException('Vui lòng cung cấp ít nhất một file để upload');
    }

    const uploadPromises = fileArray.map(async (file) => {
      if (file.mimetype === 'application/pdf') {
        // Upload PDF và thumbnail song song
        const [fileResult, thumbnailResult] = await Promise.all([
          this.uploadFile(file),
          this.uploadThumbnail(file),
        ]);
        // Thêm trường previewUrl với đuôi .jpg
        return {
          ...fileResult,
          previewUrl: this.ensureJpgExtension(thumbnailResult.secure_url),
        };
      } else {
        // Chỉ upload hình ảnh, sử dụng chính URL của hình ảnh làm previewUrl
        const fileResult = await this.uploadFile(file);
        return {
          ...fileResult,
          previewUrl: fileResult.secure_url, // Dùng chính URL của hình ảnh
        };
      }
    });

    return Promise.all(uploadPromises);
  }
}
