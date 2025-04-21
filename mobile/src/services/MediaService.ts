import { database } from '../database';
import MediaModel from '../database/models/MediaModel';
import RNFS from 'react-native-fs';
import { MediaStatus } from '~/database/types/media.types';
import { MediaRes } from '~/features/message/dto/message.dto.parent';
import axios from 'axios';
import { API_KEY, YOUTUBE_API_URL } from '~/utils/enviroment';
import { LinkMetadata } from '~/database/repositories/LinkRepository';

export class MediaService {
  private static instance: MediaService;
  private readonly mediaCollection = database.get<MediaModel>('medias');
  private readonly downloadQueue: Map<string, Promise<void>> = new Map();

  // Constructor private để áp dụng Singleton pattern
  private constructor() {}

  // Singleton: Lấy instance duy nhất
  public static getInstance(): MediaService {
    if (!MediaService.instance) {
      MediaService.instance = new MediaService();
    }
    return MediaService.instance;
  }

  // Xử lý media mới
  public async handleNewMedia(mediaData: MediaRes): Promise<MediaModel> {
    try {
      // Kiểm tra media đã tồn tại
      let media: MediaModel;
      try {
        media = await this.mediaCollection.find(mediaData.id);
        return media; // Trả về nếu đã tồn tại
      } catch (error) {
        // Không tìm thấy, tiếp tục tạo mới
      }

      // Tạo media mới trong transaction
      media = await database.write(async () => {
        return this.mediaCollection.create(record => {
          record._id = mediaData.id;
          record.roomId = mediaData.roomId ?? ''; 
          record.messageId = mediaData.messageId ?? ''; 
          record.originalName = mediaData.originalName ?? 'unnamed_file';
          record.type = mediaData.type ?? 'unknown'; 
          record.url = mediaData.url;
          record.publicId = mediaData.publicId; 
          record.format = mediaData.format ?? '';
          record.bytes = mediaData.bytes ?? 0; 
          record.width = mediaData.width ?? 0;
          record.height = mediaData.height ?? 0;
          record.duration = mediaData.duration ?? 0;
          record.previewUrl = mediaData.previewUrl ?? ''; 
          record.mimeType = mediaData.mimeType ?? ''; 
          record.status = MediaStatus.PENDING;
          record.createdAt = new Date(mediaData.createdAt).getTime(); 
        });
      });
      // Bắt đầu tải file
      await this.downloadMedia(media);

      return media;
    } catch (error) {
      console.error('Error handling new media:', error);
      throw new Error(`Failed to handle media: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Tải media xuống thiết bị
  private async downloadMedia(media: MediaModel): Promise<void> {
    // Kiểm tra nếu đang tải
    if (this.downloadQueue.has(media.id)) {
      return this.downloadQueue.get(media.id)!; // Trả về promise hiện tại
    }

    const downloadPromise = (async () => {
      try {
        // Cập nhật trạng thái bắt đầu tải
        await database.write(async () => {
          await media.update(record => {
            record.status = MediaStatus.UPLOADING; // Giả định MediaModel không có startDownload
          });
        });

        // Tạo thư mục lưu trữ
        const dirPath = `${RNFS.DocumentDirectoryPath}/medias/${media.roomId}`;
        const dirExists = await RNFS.exists(dirPath);
        if (!dirExists) {
          await RNFS.mkdir(dirPath);
        }

        // Đường dẫn file
        const fileName = media.originalName || 'unnamed_file'; // Fallback nếu originalName rỗng
        const filePath = `${dirPath}/${media.id}_${fileName}`;
        const downloadOptions = {
          fromUrl: media.url,
          toFile: filePath,
          progress: (res: { contentLength: number; bytesWritten: number }) => {
            const progress = res.bytesWritten / res.contentLength;
            database.write(async () => {
              await media.update(record => {
                record.downloadProgress = progress; // Giả định MediaModel có trường này
              });
            });
          },
        };

        // Tải file
        const { promise } = RNFS.downloadFile(downloadOptions);
        await promise;

        // Cập nhật trạng thái hoàn tất
        await database.write(async () => {
          await media.update(record => {
            record.status = MediaStatus.UPLOADED; // Giả định không có completeDownload
            record.localPath = filePath; // Giả định MediaModel có trường này
          });
        });
      } catch (error) {
        console.error('Error downloading media:', error);
        await database.write(async () => {
          await media.update(record => {
            record.status = MediaStatus.ERROR; // Giả định không có markError
            record.errorMessage = error instanceof Error ? error.message : 'Download failed'; // Giả định có trường này
          });
        });
        throw error;
      } finally {
        this.downloadQueue.delete(media.id);
      }
    })();

    this.downloadQueue.set(media.id, downloadPromise);
    return downloadPromise;
  }

  // Thử tải lại media
  public async retryDownload(mediaId: string): Promise<void> {
    try {
      const media = await this.mediaCollection.find(mediaId);
      if (!media) {
        throw new Error(`Media with ID ${mediaId} not found`);
      }
      await this.downloadMedia(media);
    } catch (error) {
      console.error('Error retrying download:', error);
      throw new Error(`Retry download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Lấy trạng thái media
  public async getMediaStatus(mediaId: string): Promise<MediaStatus> {
    try {
      const media = await this.mediaCollection.find(mediaId);
      return media.status;
    } catch (error) {
      console.warn(`Media ${mediaId} not found, returning PENDING status`);
      return MediaStatus.PENDING; // Trả về mặc định nếu không tìm thấy
    }
  }

  //lấy thông tin khi là link
  public fetchVideoInfo = async (videoId): Promise<LinkMetadata | null> => {
    try {
      const response = await axios.get(YOUTUBE_API_URL, {
        params: {
          part: 'snippet',
          id: videoId,
          key: API_KEY,
        },
      });
  
      const videoData = response.data.items[0]?.snippet;
      if (videoData) {
        return {
          title: videoData.title,
          description: videoData.description,
          thumbnail: videoData.thumbnails.default.url,
          source: videoData.channelTitle,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching YouTube data:', error);
      return null;
    }
  };
}