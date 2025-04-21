import { Q } from '@nozbe/watermelondb';
import MediaModel from '../models/MediaModel';
import { database } from '..';
import { MediaRes } from '~/features/message/dto/message.dto.parent';
import { MediaStatus } from '../types/media.types';

export class MediaRepository {
  private static instance: MediaRepository;

  private mediasCollection = database.get<MediaModel>('medias');

  private constructor() {}

  static getInstance(): MediaRepository {
    if (!MediaRepository.instance) {
      MediaRepository.instance = new MediaRepository();
    }
    return MediaRepository.instance;
  }

  async prepareMedia(media: MediaRes) {
    if(!media.messageId) return;
    const existing = await this.mediasCollection
      .query(Q.where('message_id', media.messageId))
      .fetch();
  
    if (existing.length > 0) {
      // Nếu đã tồn tại, cập nhật bản ghi đầu tiên tìm thấy
      return existing[0].prepareUpdate(record => {
        record.url = media.url;
        record.publicId = media.publicId;
        record.format = media.format ?? '';
        record.bytes = media.bytes ?? 0;
        record.width = media.width ?? 0;
        record.height = media.height ?? 0;
        record.duration = media.duration ?? 0;
        record.previewUrl = media.previewUrl ?? '';
        record.originalName = media.originalName ?? '';
        record.mimeType = media.mimeType ?? '';
        record.localPath = media.localPath ?? '';
        record.roomId = media.roomId ?? '';
        record.status = MediaStatus.PENDING;
      });
    } else {
      // Nếu chưa tồn tại, tạo mới
      return this.mediasCollection.prepareCreate(record => {
        record._id = media.id;
        record.url = media.url;
        record.publicId = media.publicId;
        record.format = media.format ?? '';
        record.bytes = media.bytes ?? 0;
        record.width = media.width ?? 0;
        record.height = media.height ?? 0;
        record.duration = media.duration ?? 0;
        record.previewUrl = media.previewUrl ?? '';
        record.originalName = media.originalName ?? '';
        record.mimeType = media.mimeType ?? '';
        record.localPath = media.localPath ?? '';
        record.messageId = media.messageId ?? '';
        record.roomId = media.roomId ?? '';
        record.status = MediaStatus.PENDING;
      });
    }
  }
  

  async batch(records: MediaModel[], insideTransaction = true): Promise<void> {
    const writeFn = async () => {
      await database.batch(...records);
    };
  
    if (insideTransaction) {
      await database.write(writeFn, 'BatchMediaRecords');
    } else {      
      await writeFn();
    }
  }

  async getByRoomId(roomId: string) {
    return this.mediasCollection.query(Q.where('room_id', roomId)).fetch(); 
  }

  async updateStatus(mediaId: string, status: MediaStatus) {
    const media = await this.mediasCollection.find(mediaId);  
    await database.write(async () => {
      media.status = status;  
    });
  }

  // Phương thức để cập nhật tất cả thông tin media
  async updateFullMediaDetails(mediaId: string, updates: MediaRes) {
    try {
      const localMedias = await this.mediasCollection
        .query(Q.where('_id', mediaId))
        .fetch();
          
      if (!localMedias.length) {
        console.warn(`No local media found with id: ${mediaId}`);
        return;
      }
  
      await localMedias[0].update(record => {
        record._id = updates.id;
        record.url = updates.url;
        record.publicId = updates.publicId;
        record.format = updates.format ?? '';
        record.bytes = updates.bytes ?? 0;
        record.width = updates.width ?? 0;
        record.height = updates.height ?? 0;
        record.duration = updates.duration ?? 0;
        record.previewUrl = updates.previewUrl ?? '';
        record.originalName = updates.originalName ?? '';
        record.mimeType = updates.mimeType ?? '';
        record.type = updates?.type ?? ''; // xử lý an toàn
        record.messageId = updates.messageId ?? '';
        record.roomId = updates.roomId ?? '';
        record.status = MediaStatus.UPLOADED ?? '';
        // record.downloadProgress = 100;
        // record.errorMessage = null;
      });
  
    } catch (error) {
      console.error('❌ Error in updateFullMediaDetails:', error);
    }
  }
  
  async updateMediaStatus(
    mediaId: string, 
    status: MediaStatus, 
    errorMessage?: string,
    downloadProgress: number = 0
  ) {
    try {
      const localMedias = await this.mediasCollection
        .query(Q.where('_id', mediaId))
        .fetch();
          
      if (!localMedias.length) {
        console.warn(`No local media found with id: ${mediaId}`);
        return;
      }
  
      await localMedias[0].update(record => {
        record.status = status;
        if (errorMessage) {
          record.errorMessage = errorMessage;
        }
        record.downloadProgress = downloadProgress;
      });
  
    } catch (error) {
      console.error('❌ Error in updateMediaStatus:', error);
    }
  }

  // Thêm hàm để xóa media theo messageId
  async deleteMediaByMessageId(messageId: string) {
    try {
      const medias = await this.mediasCollection
        .query(Q.where('message_id', messageId))
        .fetch();
      
      await database.write(async () => {
        await Promise.all(medias.map(media => media.destroyPermanently()));
      });
    } catch (error) {
      console.error('❌ Error in deleteMediaByMessageId:', error);
    }
  }
}
