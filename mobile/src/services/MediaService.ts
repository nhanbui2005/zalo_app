import { database } from '../database';
import MediaModel from '../database/models/MediaModel';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';

export class MediaService {
  private static instance: MediaService;
  private mediaCollection = database.get<MediaModel>('medias');
  private downloadQueue: Map<string, Promise<void>> = new Map();

  private constructor() {}

  static getInstance(): MediaService {
    if (!MediaService.instance) {
      MediaService.instance = new MediaService();
    }
    return MediaService.instance;
  }

  async handleNewMedia(mediaData: {
    _id: string;
    room_id: string;
    msg_id: string;
    name: string;
    type: string;
    url: string;
    size?: number;
    duration?: number;
    preview_image?: string;
    metadata?: any;
  }) {
    try {
      // Kiểm tra xem media đã tồn tại chưa
      const existingMedia = await this.mediaCollection.find(mediaData._id);
      if (existingMedia) {
        return existingMedia;
      }

      // Tạo media mới
      const media = await this.mediaCollection.create(record => {
        record._id = mediaData._id;
        record.roomId = mediaData.room_id;
        record.msgId = mediaData.msg_id;
        record.name = mediaData.name;
        record.type = mediaData.type;
        record.url = mediaData.url;
        record.size = mediaData.size || null;
        record.duration = mediaData.duration || null;
        record.image = mediaData.preview_image || null;
        record.metadata = mediaData.metadata || {};
        record.status = 'pending';
        record.downloadProgress = 0;
        record.createdAt = Date.now();
      });

      // Bắt đầu tải
      this.downloadMedia(media);

      return media;
    } catch (error) {
      console.error('Error handling new media:', error);
      throw error;
    }
  }

  private async downloadMedia(media: MediaModel) {
    // Kiểm tra nếu đang tải
    if (this.downloadQueue.has(media._id)) {
      return;
    }

    const downloadPromise = (async () => {
      try {
        await media.startDownload();

        // Tạo thư mục nếu chưa tồn tại
        const dirPath = `${RNFS.DocumentDirectoryPath}/medias/${media.roomId}`;
        const dirExists = await RNFS.exists(dirPath);
        if (!dirExists) {
          await RNFS.mkdir(dirPath);
        }

        // Tải file
        const filePath = `${dirPath}/${media._id}_${media.name}`;
        const downloadOptions = {
          fromUrl: media.url,
          toFile: filePath,
          progress: (res: { contentLength: number; bytesWritten: number }) => {
            const progress = res.bytesWritten / res.contentLength;
            media.updateProgress(progress);
          },
        };

        await RNFS.downloadFile(downloadOptions).promise;
        await media.completeDownload(filePath);

      } catch (error: any) {
        console.error('Error downloading media:', error);
        await media.markError(error.message || 'Download failed');
      } finally {
        this.downloadQueue.delete(media._id);
      }
    })();

    this.downloadQueue.set(media._id, downloadPromise);
  }

  async retryDownload(mediaId: string) {
    const media = await this.mediaCollection.find(mediaId);
    if (media) {
      this.downloadMedia(media);
    }
  }

  async getLocalPath(mediaId: string): Promise<string | null> {
    const media = await this.mediaCollection.find(mediaId);
    return media?.localPath || null;
  }

  async getDownloadProgress(mediaId: string): Promise<number> {
    const media = await this.mediaCollection.find(mediaId);
    return media?.downloadProgress || 0;
  }

  async getMediaStatus(mediaId: string): Promise<'pending' | 'downloading' | 'completed' | 'error'> {
    const media = await this.mediaCollection.find(mediaId);
    return media?.status || 'pending';
  }
} 