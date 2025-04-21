// Middleware kiểm tra file
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class FileValidationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const file = req.file;
    const allowedMimeTypes = [
      'image/png', 'image/jpeg', 'image/jpg', 'image/gif',
      'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip', 'application/x-rar-compressed',
      'application/x-msdownload', 'application/octet-stream'
    ];

    if (file && !allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({ message: 'Invalid file type' });
    }

    next();
  }
}
