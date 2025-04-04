import { Model } from '@nozbe/watermelondb';
import { field, text, immutableRelation, json } from '@nozbe/watermelondb/decorators';
import UserModel from './UserModel';
import RoomModel from './RoomModel';

export default class MediaModel extends Model {
  static table = 'medias';

  @text('_id') _id!: string; 
  @text('room_id') roomId!: string;
  @text('msg_id') msgId!: string;
  @text('name') name!: string; 
  @text('type') type!: string;
  @text('url') url!: string;
  @text('local_path') localPath: string | null = null;
  @text('status') status: 'pending' | 'downloading' | 'completed' | 'error' = 'pending';
  @text('call_status') callStatus: string | null = null;
  @text('preview_image') image: string | null = null;
  @field('duration') duration: number | null = null;
  @field('size') size: number | null = null;
  @field('download_progress') downloadProgress: number = 0;
  @field('created_at') createdAt!: number;
  @json('metadata', json => json) metadata: any = {};

  @immutableRelation('users', 'user_id') user!: UserModel;
  @immutableRelation('chatrooms', 'room_id') room!: RoomModel;

  // Helper methods
  async startDownload() {
    await this.update(record => {
      record.status = 'downloading';
      record.downloadProgress = 0;
    });
  }

  async updateProgress(progress: number) {
    await this.update(record => {
      record.downloadProgress = progress;
    });
  }

  async completeDownload(localPath: string) {
    await this.update(record => {
      record.status = 'completed';
      record.localPath = localPath;
      record.downloadProgress = 100;
    });
  }

  async markError(error: string) {
    await this.update(record => {
      record.status = 'error';
      record.metadata = { ...record.metadata, error };
    });
  }
}
