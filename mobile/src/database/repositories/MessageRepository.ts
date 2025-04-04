import {database} from '~/database';
import { Q, Query} from '@nozbe/watermelondb';
import {_MessageSentRes} from '~/features/message/dto/message.dto.parent';
import {
  MessageContentType,
  MessageViewStatus,
} from '~/features/message/dto/message.enum';
import MessageModel from '../models/MessageModel';
import RoomRepository from './RoomRepository';
import { Observable } from 'rxjs';
import { MessageItemView } from '../types/message.type';
import { CursorPaginatedRes, PageOptionsDto } from '~/features/common/pagination/paginationDto';
import { nanoid } from 'nanoid';
import EmojiModel from '../models/EmojiModel';
import { UserItemBaseView } from '../types/user.typee';
import MediaModel from '../models/MediaModel';

export default class MessageRepository {
  private static instance: MessageRepository; 

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
    beforCursor?: number
  ): Observable<MessageItemView[]> {    
    return new Observable(observer => {
      let query = this.messagesCollection
        .query(Q.where('room_id', roomId), Q.sortBy('created_at', Q.desc));
  
        console.log('afterCursor', afterCursor);
        console.log('beforCursor', beforCursor);

      if (afterCursor) {
        query = query.extend(Q.where('created_at', Q.gt(afterCursor)));
      }
      
      const observableQuery = query.observeWithColumns(['status', 'content', 'created_at']);
        
      const subscription = observableQuery.subscribe(async messages => {    
        const messageIds = messages.map(msg => msg._id);
  
        // Lấy danh sách emoji liên quan đến các tin nhắn
        const emojis = await this.emojisCollection
          .query(Q.where('message_id', Q.oneOf(messageIds)))
          .fetch();
  
        // Tạo map từ messageId -> danh sách emoji
        const emojiMap: { [key: string]: string[] } = {};
        emojis.forEach(emoji => {
          if (!emojiMap[emoji.messageId]) {
            emojiMap[emoji.messageId] = [];
          }
          emojiMap[emoji.messageId].push(emoji.content);
        });

        // Lấy danh sách media liên quan đến các tin nhắn có mediaId
        const mediaMessages = messages.filter(msg => !!msg.mediaId);
        let mediaMap: { [key: string]: MediaModel } = {};

        if (mediaMessages.length > 0) {
          const mediaRecords = await this.mediaCollection
            .query(Q.where('msg_id', Q.oneOf(mediaMessages.map(msg => msg.id))))
            .fetch();

          mediaRecords.forEach(media => {
            mediaMap[media.msgId] = media;
          });
        }

        // Map tin nhắn thành MessageItemView[]
        const mappedMessages: MessageItemView[] = messages.map(msg => {
          
          const mappedMessage = {
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
            emojis: emojiMap[msg.id] || [],
            sender: msg.senderId ? userMap.get(msg.senderId) : { id: '', username: 'Unknown', avatarUrl: '', preferredName: '' },
            media: mediaMap[msg.id] || null, 
          };
          return mappedMessage;
        });
        
        
        observer.next(mappedMessages);
      });

      return () => subscription.unsubscribe();
    });
  }
  
  // Hàm chuẩn bị tin nhắn để tạo
  async prepareMessages(
    pendingMessages: { roomId: string; messages: Partial<_MessageSentRes>[] }[],
    mediaId ?: string
  ): Promise<MessageModel[]> {
    const messagesCollection = database.get<MessageModel>('messages');
    const preparedMessages: MessageModel[] = [];
    
    try {
      // Lấy danh sách message IDs để kiểm tra tồn tại
      const messageIds = pendingMessages
        .flatMap(({ messages }) => messages.map(msg => msg.id))
        .filter((id): id is string => id !== undefined && id !== null);
  
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
        // Kiểm tra roomId hợp lệ
        if (!roomId) {
          console.warn(`Invalid roomId: ${roomId}, skipping messages`);
          continue;
        }

        for (const msg of messages) {
          // Chuẩn hóa createdAt và updatedAt thành số
         // Kiểm tra và chuẩn hóa thời gian
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

          // Kiểm tra tin nhắn đã tồn tại chưa (dùng msg.id để tra cứu trong Map)
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
                  message.updatedAt = updatedAtNum
                  message.roomId = roomId;
                  message.type =
                    (msg.type as MessageContentType) || existingMessage.type || MessageContentType.TEXT;
                  message.status =
                    (msg.status as MessageViewStatus) || existingMessage.status || MessageViewStatus.SENDING;
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
                message.createdAt =createdAtNum;
                message.updatedAt = updatedAtNum
                message.type = (msg.type as MessageContentType) || MessageContentType.TEXT;
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
      throw error; // Hoặc xử lý lỗi theo cách bạn muốn
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
    roomRepository: RoomRepository
  ): Promise<void> {
    try {      
      const localMessages = await messageRepository.messagesCollection
      .query(Q.where('_id', tempId))
      .fetch();
      await database.write(async () => {
        if (localMessages.length > 0) {
          // Cập nhật tin nhắn hiện có
          await localMessages[0].update(message => {
            message._id = serverMessage.id; 
            message.senderId = serverMessage.senderId;
            message.status = serverMessage.status || MessageViewStatus.SENT;
            message.replyMessageId = serverMessage.replyMessageId;
            message.updatedAt = Number(new Date(serverMessage.updatedAt));
            message.createdAt = Number(new Date(serverMessage.createdAt));
          });
          
          // Đảm bảo rằng Observable sẽ phát hiện thay đổi
          // Bằng cách cập nhật lại trường updatedAt
          await localMessages[0].update(message => {
            message.updatedAt = Date.now();
          });
          
        }
      })      
    } catch (error) {
      console.error(`❌ Failed to update sent message ${tempId}:`, error);
      throw error;
    }
  }

  async getMessages(
    roomId: string,
    options: PageOptionsDto = {},
    messageRepository: MessageRepository,
  ): Promise<CursorPaginatedRes<MessageItemView>> {
    try {      
      const { limit = 20, afterCursor, beforeCursor } = options;
      console.log('beforeCursor', beforeCursor);
      
  
      let query: Query<any> = messageRepository.messagesCollection.query(
        Q.where('room_id', roomId),
        Q.sortBy('created_at', Q.desc),
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

      const limitedMessagesData = limitedMessages.map(msg => msg._raw);
      
      // Ánh xạ dữ liệu vào MessageItemView
      const resultMessages: MessageItemView[] = limitedMessagesData.map(msg => ({
        id: msg._id,
        content: msg.content,
        type: msg.type as MessageContentType,
        senderId: msg.sender_id,
        roomId: msg.room_id,
        status: msg.status,
        replyMessageId: msg.reply_message_id,
        revoked: msg.revoked,
        createdAt: new Date(msg.created_at),
        updatedAt: new Date(msg.updated_at),
        sender: msg.sender_id, 
      }));      

      const endCursor = resultMessages.length > 0
        ? resultMessages[resultMessages.length - 1].createdAt.getTime()
        : undefined;
      const startCursor = resultMessages.length > 0
        ? resultMessages[0].createdAt.getTime()
        : undefined;

        
      return {
        data: resultMessages,
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
