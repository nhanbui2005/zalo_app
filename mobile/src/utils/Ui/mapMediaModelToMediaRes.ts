import MediaModel from "~/database/models/MediaModel";
import { MediaRes } from "~/features/message/dto/message.dto.parent";

export function mapMediaModelToMediaRes(media: MediaModel): MediaRes {    
    return {
      id: media._id,
      url: media.url,
      publicId: media.publicId,
      format: media.format || undefined,
      bytes: media.bytes || undefined,
      width: media.width || undefined,
      height: media.height || undefined,
      duration: media.duration || undefined,
      previewUrl: media.previewUrl || undefined,
      originalName: media.originalName || undefined,
      localPath: media.localPath || '',
      mimeType: media.mimeType || undefined,
      type: media.type || undefined,
      messageId: media.messageId || undefined,
      roomId: media.roomId || undefined,
      createdAt: new Date(media.createdAt).toISOString(),
      updatedAt: new Date(media.createdAt).toISOString(), // Thay bằng media.updatedAt nếu có
    };
  }