import axios from 'axios';
import { Q } from '@nozbe/watermelondb';
import { database } from '..';
import LinkMetadataModel, { LinkType } from '../models/LinkModel';
import { API_KEY } from '~/utils/enviroment';
import { DOMParser } from 'react-native-html-parser';
import URL from 'url-parse';
import { load } from 'react-native-cheerio';

export interface LinkMetadata {
  thumbnail?: string;
  title?: string;
  description?: string;
  source?: string;
  type: LinkType;
}

interface FetchLinkResult {
  type: LinkType;
  metadata: LinkMetadata;
}

/**
 * Repository xử lý metadata của các link (YouTube, bài báo, hoặc link khác).
 */
export class LinkRepository {
  private static instance: LinkRepository;
  private linksCollection = database.get<LinkMetadataModel>('links');

  private constructor() {
    if (!database || !this.linksCollection) {
      throw new Error('Database or linksCollection is not initialized');
    }
  }

  /**
   * Lấy instance singleton của LinkRepository.
   * @returns LinkRepository instance
   */
  static getInstance(): LinkRepository {
    if (!LinkRepository.instance) {
      LinkRepository.instance = new LinkRepository();
    }
    return LinkRepository.instance;
  }

  /**
   * Lấy metadata của bài báo từ Open Graph hoặc HTML.
   * @param url URL của bài báo
   * @returns Metadata của bài báo
   */
  private async fetchArticleMetadata(url: string): Promise<LinkMetadata> {
    try {
      const response = await axios.get(url, { timeout: 5000 });
      const html = response.data;
  
      const $ = load(html);
  
      const getMetaContent = (property: string): string | null => {
        const meta = $(`meta[property="${property}"], meta[name="${property}"]`).first();
        return meta.length ? meta.attr('content') || null : null;
      };
  
      const title = getMetaContent('og:title') || $('title').text() || 'Unknown Title';
      const description = getMetaContent('og:description') || getMetaContent('description') || '';
      const thumbnail = getMetaContent('og:image') || undefined;
      const hostnameMatch = url.match(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/i);
      const source = hostnameMatch ? hostnameMatch[1] : 'Unknown Source';
  
      return { title, description, thumbnail, source, type: LinkType.ARTICLE };
    } catch (error) {
      console.error(`Error fetching article metadata for ${url}:`, error);
      const hostnameMatch = url.match(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/i);
      return {
        title: 'Unknown Title',
        description: '',
        source: hostnameMatch ? hostnameMatch[1] : 'Unknown Source',
        type: LinkType.ARTICLE,
      };
    }
  }

  /**
   * Lấy metadata của video YouTube từ API YouTube.
   * @param videoId ID của video YouTube
   * @param url URL gốc của video
   * @returns Metadata của video
   */
  private async fetchYouTubeMetadata(videoId: string, url: string): Promise<LinkMetadata> {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`,
        { timeout: 5000 }
      );
      
      const video = response.data.items[0];
console.log('.................', video);

      if (video) {
        return {
          thumbnail: video.snippet.thumbnails.high.url,
          title: video.snippet.title,
          description: video.snippet.description.slice(0, 100) + '...',
          source: video.snippet.channelTitle,
          type: LinkType.YOUTUBE,
        };
      }
    } catch (error) {
      console.error(`Error fetching YouTube metadata for video ${videoId}:`, error);
    }
    return {
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      title: 'Unknown Title',
      description: '',
      source: 'YouTube',
      type: LinkType.YOUTUBE,
    };
  }

  /**
   * Nhận diện loại link và lấy metadata tương ứng.
   * @param url URL của link
   * @returns Kiểu link và metadata
   */
  async fetchLinkMetadata(url: string): Promise<FetchLinkResult> {
    let type: LinkType = LinkType.OTHER;
    let metadata: any = {};
  
    const youtubeRegex =
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) {
      type = LinkType.YOUTUBE;
      metadata = await this.fetchYouTubeMetadata(youtubeMatch[1], url);
    } else {
      try {
        const parsedUrl = new URL(url);
        const hostname = parsedUrl.hostname;
        const newsDomains = ['vnexpress.net', 'thanhnien.vn', 'tuoitre.vn', 'news.google.com'];
        if (newsDomains.some((domain) => hostname.includes(domain))) {
          type = LinkType.ARTICLE;
          metadata = await this.fetchArticleMetadata(url);
        } else {
          type = LinkType.OTHER;
          metadata = {
            title: 'Link',
            source: hostname,
          };
        }
      } catch (error) {
        console.error(`Error parsing URL ${url}:`, error);
        metadata = {
          title: 'Link',
          source: 'Unknown Source',
        };
      }
    }
  
    return { type, metadata };
  }
  /**
   * Thêm metadata của link vào cơ sở dữ liệu.
   * @param messageId ID của tin nhắn
   * @param roomId ID của phòng chat
   * @param url URL của link
   * @returns Metadata đã lưu hoặc null nếu thất bại
   */
  async addLinkMetadata(messageId: string, roomId: string, url: string): Promise<LinkMetadata | null> {
    try {
      const { type, metadata } = await this.fetchLinkMetadata(url);
      if (!metadata) return null;
  
      // Gọi create trực tiếp mà không cần database.write
      const record = await this.linksCollection.create((record) => {
        record._id = `${messageId}_link`;
        record.type = type;
        record.url = url;
        record.thumbnail = metadata.thumbnail;
        record.title = metadata.title;
        record.description = metadata.description;
        record.source = metadata.source;
        record.createdAt = Date.now();
        record.messageId = messageId;
        record.roomId = roomId;
      });
  
      return {
        thumbnail: record.thumbnail,
        title: record.title,
        description: record.description,
        source: record.source,
        type: record.type,
      };
    } catch (error) {
      console.error(`Error adding link metadata for message ${messageId}:`, error);
      return null;
    }
  }

  /**
   * Lấy metadata của link dựa trên danh sách messageId.
   * @param messageIds Danh sách ID tin nhắn
   * @returns Map từ messageId sang metadata
   */
  async getLinkMetadataByMessageIds(messageIds: string[]): Promise<{ [key: string]: LinkMetadata }> {
    try {
      const records = await this.linksCollection
        .query(Q.where('message_id', Q.oneOf(messageIds)))
        .fetch();

      const linkMetadataMap: { [key: string]: LinkMetadata } = {};
      records.forEach((record) => {
        linkMetadataMap[record.messageId] = {
          thumbnail: record.thumbnail,
          title: record.title,
          description: record.description,
          source: record.source,
          type: record.type,
        };
      });

      return linkMetadataMap;
    } catch (error) {
      console.error('Error fetching link metadata:', error);
      return {};
    }
  }

  /**
   * Cập nhật metadata của link.
   * @param messageId ID của tin nhắn
   * @param url URL mới của link
   * @returns Metadata đã cập nhật hoặc null nếu thất bại
   */
  async updateLinkMetadata(messageId: string, url: string): Promise<LinkMetadata | null> {
    try {
      const existingRecords = await this.linksCollection
        .query(Q.where('message_id', messageId))
        .fetch();

      if (existingRecords.length === 0) {
        return null;
      }

      const { type, metadata } = await this.fetchLinkMetadata(url);
      if (!metadata) return null;

      await database.write(async () => {
        await existingRecords[0].update((record) => {
          record.type = type;
          record.url = url;
          record.thumbnail = metadata.thumbnail;
          record.title = metadata.title;
          record.description = metadata.description;
          record.source = metadata.source;
          record.createdAt = Date.now();
        });
      });

      return metadata;
    } catch (error) {
      console.error(`Error updating link metadata for message ${messageId}:`, error);
      return null;
    }
  }

  /**
   * Xóa metadata của link.
   * @param messageId ID của tin nhắn
   */
  async deleteLinkMetadata(messageId: string): Promise<void> {
    try {
      const records = await this.linksCollection
        .query(Q.where('message_id', messageId))
        .fetch();

      if (records.length > 0) {
        await database.write(async () => {
          await records[0].destroyPermanently();
        });
      }
    } catch (error) {
      console.error(`Error deleting link metadata for message ${messageId}:`, error);
    }
  }
}

export default LinkRepository.getInstance();