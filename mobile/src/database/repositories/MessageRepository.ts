import {database} from '~/database';
import { Q, Query} from '@nozbe/watermelondb';
import {_MessageSentRes, MediaRes} from '~/features/message/dto/message.dto.parent';

import MessageModel from '../models/MessageModel';
import { Observable } from 'rxjs';
import { MessageItemView } from '../types/message.type';
import { CursorPaginatedRes, PageOptionsDto } from '~/features/common/pagination/paginationDto';
import EmojiModel from '../models/EmojiModel';
import { UserItemBaseView } from '../types/user.typee';
import MediaModel from '../models/MediaModel';
import { MediaRepository } from './MediaRepository';
import { mapMediaModelToMediaRes } from '~/utils/Ui/mapMediaModelToMediaRes';
import { MessageContentType, MessageViewStatus } from '~/features/message/dto/message.enum';
import { LinkMetadata, LinkRepository } from './LinkRepository';
import LinkMetadataModel from '../models/LinkModel';

export default class MessageRepository {
  private static instance: MessageRepository; 
  private linkCollection = database.get<LinkMetadataModel>('links');
  private messagesCollection = database.get<MessageModel>('messages');  
  private emojisCollection = database.get<EmojiModel>('emojis');
  private mediaCollection = database.get<MediaModel>('medias');

  private constructor() {} // Chặn việc tạo instance từ bên ngoài

  static getInstance(): MessageRepository {
    if (!MessageRepository.instance) {
      MessageRepository.instance = new MessageRepository();
    }
    return MessageRepository.instance;
  }

  // Kiểm tra bảng messages có trống không
  async isMessagesTableEmpty(): Promise<boolean> {
    const messages = await this.messagesCollection.query().fetchCount();
    return messages === 0;
  }
  // Khởi tạo tin nhắn lần đầu vào app
  async initializeMessages(messages: _MessageSentRes[]): Promise<void> {
    await database.write(async () => {
      // Xóa toàn bộ tin nhắn cũ
      const allMessages = await this.messagesCollection.query().fetch();
      await Promise.all(allMessages.map(msg => msg.destroyPermanently()));

      // Chuẩn bị và lưu tin nhắn mới
      const pendingMessages = messages.map(msg => ({
        roomId: msg.roomId,
        messages: [msg],
      }));
      const messagesToCreate = await this.prepareMessages(
        pendingMessages,
      );
      await this.batchMessages(messagesToCreate);
    });
  }
  // Lấy danh sách tin nhắn theo roomId
  getMessagesByRoomIdObservable(
    roomId: string,
    userMap: Map<string, UserItemBaseView>,
    afterCursor?: number,
    beforeCursor?: number
  ): Observable<MessageItemView[]> {
    const linkRepo = LinkRepository.getInstance();
    return new Observable(observer => {
      let query = this.messagesCollection
        .query(Q.where('room_id', roomId), Q.sortBy('created_at', Q.desc));
  
      console.log('afterCursor', afterCursor);
      console.log('beforeCursor', beforeCursor);
  
      if (afterCursor) {
        query = query.extend(Q.where('created_at', Q.gt(afterCursor)));
      }
      if (beforeCursor) {
        query = query.extend(Q.where('created_at', Q.lt(beforeCursor)));
      }
  
      const observableQuery = query.observeWithColumns(['status', 'content', 'created_at']);
  
      const subscription = observableQuery.subscribe(async messages => {
        const messageIds = messages.map(msg => msg._id);
  
        const emojis = await this.emojisCollection
          .query(Q.where('message_id', Q.oneOf(messageIds)))
          .fetch();
  
        const emojiMap: { [key: string]: string[] } = {};
        emojis.forEach(emoji => {
          if (!emojiMap[emoji.messageId]) {
            emojiMap[emoji.messageId] = [];
          }
          emojiMap[emoji.messageId].push(emoji.content);
        });
  
        const mediaRecords = await this.mediaCollection
          .query(Q.where('message_id', Q.oneOf(messageIds)))
          .fetch();
  
        // Map từ messageId sang một mảng MediaRes
        let mediaMap: { [key: string]: MediaRes[] } = {};
        mediaRecords.forEach((media: any) => {
          if (!mediaMap[media.messageId]) {
            mediaMap[media.messageId] = [];
          }
          mediaMap[media.messageId].push(mapMediaModelToMediaRes(media));
        });
  
        const linkMetadataRecords = await this.linkCollection
          .query(Q.where('message_id', Q.oneOf(messageIds))).fetch();
  
        const linkMetadataMap: { [key: string]: LinkMetadata } = {};
        linkMetadataRecords.forEach((link: any) => {
          
          if (!linkMetadataMap[link.messageId]) {
            linkMetadataMap[link.messageId] = {
              thumbnail: link.thumbnail,
              title: link.title,
              description: link.description,
              source: link.source,
              type: link.type
            };
          }
        });
  
        // Fallback: Fetch link metadata cho các tin nhắn chưa có
        const messagesNeedingMetadata = messages.filter(msg => !linkMetadataMap[msg._id]);
        const metadataPromises = messagesNeedingMetadata.map(async (msg) => {
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          const match = msg.content.match(urlRegex);
          if (match) {
            const url = match[0];
            try {
              const metadata = await linkRepo.addLinkMetadata(msg._id, roomId, url);
              if (metadata) {
                linkMetadataMap[msg._id] = metadata;
              }
            } catch (error) {
              console.error('Failed to fetch link metadata for message', msg._id, error);
            }
          }
        });
  
        await Promise.all(metadataPromises);
  
        const mappedMessages: MessageItemView[] = messages.map((msg: any) => {
          const linkMetadata = linkMetadataMap[msg._id] || null;
          const media = mediaMap[msg._id] || null; // Media giờ là MediaRes[] | null
  
          return {
            id: msg._id,
            content: msg.content,
            type: msg.type as MessageContentType,
            senderId: msg.senderId || '',
            roomId: msg.roomId,
            status: msg.status,
            replyMessageId: msg.replyMessageId,
            revoked: msg.revoked,
            createdAt: new Date(msg.createdAt),
            updatedAt: new Date(msg.updatedAt),
            emojis: emojiMap[msg._id] || [],
            sender: msg.senderId
              ? userMap.get(msg.senderId) || { id: '', username: 'Unknown', avatarUrl: '', preferredName: '' }
              : { id: '', username: 'Unknown', avatarUrl: '', preferredName: '' },
            media, // Media giờ là mảng MediaRes[] | null
            linkMetadata,
          };
        });
  
        observer.next(mappedMessages);
      });
  
      return () => subscription.unsubscribe();
    });
  }
  
  // Hàm chuẩn bị tin nhắn để tạo
  async prepareMessages(
    pendingMessages: { roomId: string; messages: Partial<_MessageSentRes>[] }[],
  ): Promise<MessageModel[]> {
    
    const messagesCollection = database.get<MessageModel>('messages');
    const preparedMessages: MessageModel[] = [];
  
    try {
      // Lấy danh sách message IDs để kiểm tra tồn tại
      const messageIds = pendingMessages
      .flatMap(({ messages }) =>
        (messages ?? []).filter(Boolean).map(msg => msg.id)
      )
      .filter(Boolean) as string[];

      // Query các tin nhắn đã tồn tại
      const existingMessages = messageIds.length
        ? await messagesCollection
            .query(Q.where('_id', Q.oneOf(messageIds)))
            .fetch()
        : [];
      const existingMessagesMap = new Map(
        existingMessages.map(msg => [msg._id, msg])
      );
  
      // Duyệt qua từng room và messages
      for (const { roomId, messages } of pendingMessages) {
        if (!messages) continue; // Bỏ qua nếu messages là undefined hoặc null
  
        for (const msg of messages) {
          // Kiểm tra msg có tồn tại không
          if (!msg) continue;
  
          // Chuẩn hóa createdAt và updatedAt thành số
          const parseTimestamp = (date: any): number => {
            if (!date) return Date.now();
            if (typeof date === 'string') {
              const parsedDate = new Date(date);
              return isNaN(parsedDate.getTime()) ? Date.now() : parsedDate.getTime();
            }
            if (date instanceof Date) {
              return isNaN(date.getTime()) ? Date.now() : date.getTime();
            }
            return Date.now();
          };
  
          // Chuyển đổi thời gian
          const createdAtNum = parseTimestamp(msg.createdAt);
          const updatedAtNum = parseTimestamp(msg.updatedAt);
  
          // Kiểm tra tin nhắn đã tồn tại chưa
          const existingMessage = msg.id ? existingMessagesMap.get(msg.id) : null;
  
          if (existingMessage) {
            // Nếu tin nhắn đã tồn tại, kiểm tra thời gian cập nhật
            const serverUpdatedAt = updatedAtNum;
            const localUpdatedAt = existingMessage.updatedAt || 0;
  
            if (serverUpdatedAt > localUpdatedAt) {
              preparedMessages.push(
                existingMessage.prepareUpdate((message: MessageModel) => {
                  message.content = msg.content || existingMessage.content || 'aaa';
                  message.senderId = msg.senderId || existingMessage.senderId;
                  message.createdAt = createdAtNum;
                  message.updatedAt = updatedAtNum;
                  message.roomId = roomId;
                  message.type =
                    (msg.type as MessageContentType) ||
                    existingMessage.type ||
                    MessageContentType.TEXT;
                  message.status =
                    (msg.status as MessageViewStatus) ||
                    existingMessage.status ||
                    MessageViewStatus.SENDING;
                  message.revoked =
                    msg.revoked !== undefined ? msg.revoked : existingMessage.revoked;
                })
              );
            }
          } else {
           
            preparedMessages.push(
              messagesCollection.prepareCreate((message: MessageModel) => {
                message._id = msg.id || '';
                message.content = msg.content || '';
                message.roomId = roomId;
                message.senderId = msg.senderId || '';
                message.createdAt = createdAtNum;
                message.updatedAt = updatedAtNum;
                message.type = msg.type || MessageContentType.TEXT || 'text';
                message.status = MessageViewStatus.SENDING;
                message.revoked = msg.revoked || false;
              })
            );
          }
        }
      }
  
      return preparedMessages;
    } catch (error) {
      console.error('Error preparing messages:', error);
      throw error;
    }
  }
  // Hàm ghi tin nhắn bằng batch
  async batchMessages(messagesToCreate: MessageModel[], insideTransaction = true): Promise<void> {
    const writeFn = async () => {
      await database.batch(...messagesToCreate);
    };
  
    if (insideTransaction) {
      await database.write(writeFn);
    } else {
      await writeFn();
    }
  }

  async updateSentMessage(
    tempId: string,
    serverMessage: _MessageSentRes,
    messageRepository: MessageRepository,
    mediaRepo: MediaRepository
  ): Promise<void> {
    const localMessages = await messageRepository.messagesCollection
      .query(Q.where('_id', tempId))
      .fetch();
  
    if (localMessages.length > 0) {
      await localMessages[0].update(message => {
        message._id = serverMessage.id;
        message.senderId = serverMessage.senderId;
        message.status = serverMessage.status || MessageViewStatus.SENT;
        message.replyMessageId = serverMessage.replyMessageId;
        message.updatedAt = Date.now();
        message.createdAt = Number(new Date(serverMessage.createdAt));
      });
    }
  }

  async getMessages(
    roomId: string,
    options: PageOptionsDto = {},
    messageRepository: MessageRepository,
    userMap: Map<string, UserItemBaseView>
  ): Promise<CursorPaginatedRes<MessageItemView>> {
    try {
      const linkRepo = LinkRepository.getInstance();
      const { limit = 20, afterCursor, beforeCursor } = options;
  
      let query = messageRepository.messagesCollection.query(
        Q.where('room_id', roomId),
        Q.sortBy('created_at', Q.desc)
      );

      if (afterCursor) {
        query = query.extend(Q.where('created_at', Q.gt(afterCursor)));
      }
      if (beforeCursor) {
        query = query.extend(Q.where('created_at', Q.lt(beforeCursor)));
      }

      const totalRecords = await query.fetchCount();
      const messages = await query.fetch();
      const limitedMessages = messages.slice(0, limit);
  
      const messageIds = limitedMessages.map((msg) => msg._id);
  
      const emojis = await messageRepository.emojisCollection
        .query(Q.where('message_id', Q.oneOf(messageIds)))
        .fetch();
  
      const emojiMap: { [key: string]: string[] } = {};
      emojis.forEach((emoji) => {
        if (!emojiMap[emoji.messageId]) {
          emojiMap[emoji.messageId] = [];
        }
        emojiMap[emoji.messageId].push(emoji.content);
      });

      // Lấy tất cả media liên quan đến các tin nhắn
      const mediaRecords = await messageRepository.mediaCollection
        .query(Q.where('message_id', Q.oneOf(messageIds)))
        .fetch();
  
      // Map từ messageId sang một mảng MediaRes
      let mediaMap: { [key: string]: MediaRes[] } = {};
      mediaRecords.forEach((media: any) => {
        if (!mediaMap[media.messageId]) {
          mediaMap[media.messageId] = [];
        }
        mediaMap[media.messageId].push(mapMediaModelToMediaRes(media));
      });

      // Lấy link metadata từ bảng link_metadata
      const linkMetadataRecords = await this.linkCollection
          .query(Q.where('message_id', Q.oneOf(messageIds))).fetch();

      // Map từ messageId sang một LinkMetadata duy nhất
      const linkMetadataMap: { [key: string]: LinkMetadata } = {};
      linkMetadataRecords.forEach((link: any) => {
        if (!linkMetadataMap[link.messageId]) {
          linkMetadataMap[link.messageId] = {
            thumbnail: link.thumbnail,
            title: link.title,
            description: link.description,
            source: link.source,
            type: link.type
          };
        }
      });
  
      // Map tin nhắn thành MessageItemView[]
      const mappedMessages: MessageItemView[] = await Promise.all(
        limitedMessages.map(async (msg: any) => {
          let linkMetadata = linkMetadataMap[msg._id] || null;
  
          // Fallback: Nếu không có link metadata, kiểm tra nội dung để lấy link
          if (!linkMetadata) {
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const match = msg.content.match(urlRegex);
            if (match) {
              const url = match[0];
              const metadata = await linkRepo.addLinkMetadata(msg._id, roomId, url);
              if (metadata) {
                linkMetadata = metadata;
              }
            }
          }
  
          const media = mediaMap[msg._id] || null; // Media giờ là MediaRes[] | null
  
          return {
            id: msg._id,
            content: msg.content,
            type: msg.type as MessageContentType,
            senderId: msg.senderId || '',
            roomId: msg.roomId,
            status: msg.status,
            replyMessageId: msg.replyMessageId,
            revoked: msg.revoked,
            createdAt: new Date(msg.createdAt),
            updatedAt: new Date(msg.updatedAt),
            emojis: emojiMap[msg._id] || [],
            sender: msg.senderId
              ? userMap.get(msg.senderId) || { id: '', username: 'Unknown', avatarUrl: '', preferredName: '' }
              : { id: '', username: 'Unknown', avatarUrl: '', preferredName: '' },
            media, // Media giờ là mảng MediaRes[] | null
            linkMetadata,
          };
        })
      );
  
      const endCursor =
        mappedMessages.length > 0 ? mappedMessages[mappedMessages.length - 1].createdAt.getTime() : undefined;
      const startCursor = mappedMessages.length > 0 ? mappedMessages[0].createdAt.getTime() : undefined;
  
      return {
        data: mappedMessages,
        pagination: {
          limit,
          afterCursor: endCursor,
          beforeCursor: startCursor,
          totalRecords,
        },
      };
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      throw error;
    }
  }
}