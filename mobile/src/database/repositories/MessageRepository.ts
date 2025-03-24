import {database} from '~/database';
import {Collection, Database, Q, Query} from '@nozbe/watermelondb';
import {_MessageSentRes} from '~/features/message/dto/message.dto.parent';
import {
  MessageContentType,
  MessageViewStatus,
} from '~/features/message/dto/message.enum';
import MessageModel from '../models/MessageModel';
import { v4 as uuidv4 } from 'uuid';
import RoomRepository from './RoomRepository';
import { Observable } from 'rxjs';
import { MessageItemView } from '../types/message.type';
import { CursorPaginatedRes, PageOptionsDto } from '~/features/common/pagination/paginationDto';
import { nanoid } from 'nanoid';
import EmojiModel from '../models/EmojiModel';

export default class MessageRepository {
  private messagesCollection = database.get<MessageModel>('messages');  
  private emojisCollection = database.get<EmojiModel>('emojis');
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
    this: MessageRepository,
    roomId: string,
    afterCursor?: number,
  ): Observable<MessageItemView[]> {
    return new Observable(observer => {
      let query = this.messagesCollection
        .query(Q.where('room_id', roomId), Q.sortBy('created_at', Q.desc));
  
      // Nếu có afterCursor, chỉ lấy tin nhắn mới hơn
      if (afterCursor) {
        query = query.extend(Q.where('created_at', Q.gt(afterCursor)));
      }
  
      const observableQuery = query.observe();
  
      const subscription = observableQuery.subscribe(async messages => {
        // Lấy tất cả messageId từ danh sách tin nhắn
        const messageIds = messages.map(msg => msg.id);
        // Query tất cả emojis có messageId trong danh sách messageIds
        const emojis = await this.emojisCollection
        .query(Q.where('message_id', Q.oneOf(messageIds)))
        .fetch();

        // Tạo map từ messageId đến danh sách content của emojis
        const emojiMap: { [key: string]: string[] } = {};
        emojis.forEach(emoji => {
          if (!emojiMap[emoji.messageId]) {
            emojiMap[emoji.messageId] = [];
          }
          emojiMap[emoji.messageId].push(emoji.content);
        });
        
        const mappedMessages = messages.map(msg => ({
          id: msg.id,
          content:msg.content,
          type: msg.type as MessageContentType,
          senderId: msg.senderId,
          roomId: msg.roomId,
          status: msg.status,
          replyMessageId: msg.replyMessageId,
          revoked: msg.revoked,
          createdAt: new Date(msg.createdAt),
          updatedAt: new Date(msg.updatedAt),
          emojis: emojiMap[msg.id] || [], 
        }));

        observer.next(mappedMessages);
      });
  
      return () => subscription.unsubscribe();
    });
  }
  // Hàm chuẩn bị tin nhắn để tạo
  async prepareMessages(
    pendingMessages: { roomId: string; messages: Partial<_MessageSentRes>[] }[]
  ): Promise<MessageModel[]> {
    const messagesCollection = database.get<MessageModel>('messages');
    const preparedMessages: MessageModel[] = [];
  
    try {
      // Lấy danh sách message IDs để kiểm tra tồn tại
      const messageIds = pendingMessages
        .flatMap(({ messages }) => messages.map(msg => msg.id))
        .filter((id): id is string => id !== undefined && id !== null);
  
      // Query các tin nhắn đã tồn tại (dùng _id thay vì id)
      const existingMessages = messageIds.length
        ? await messagesCollection
            .query(Q.where('_id', Q.oneOf(messageIds))) // Sửa id thành _id
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
            // Nếu tin nhắn chưa tồn tại, tạo mới
            if (!msg.senderId) {
              console.warn(`Invalid senderId for message: ${msg.id}, skipping`);
              continue;
            }
  
            preparedMessages.push(
              messagesCollection.prepareCreate((message: MessageModel) => {
                message._id = msg.id || nanoid();
                message.content = msg.content || 'aaa';
                message.roomId = roomId;
                message.senderId = msg.senderId || nanoid();
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
  // Hàm cập nhật tin nhắn sau khi gửi thành công lên server
  async updateSentMessage(
    tempId: string,
    serverMessage: _MessageSentRes,
    messageRepository: MessageRepository,
    roomRepository: RoomRepository,
  ): Promise<void> {
    try {
      await database.write(async () => {
        const localMessages = await messageRepository.messagesCollection.query(Q.where('_id', tempId)).fetch();
        if (localMessages.length === 0) {
          console.warn(`Local message with tempId ${tempId} not found`);
        } else {
          await localMessages[0].destroyPermanently(); // Xóa bản ghi cũ
        }

        const messagePrepare = this.prepareMessages([{ roomId: serverMessage.roomId, messages: [serverMessage] }]);
        await database.batch(messagePrepare[0]);
        await roomRepository.updateRoomLastMessage(serverMessage.roomId, messagePrepare[0], 1);
        console.log(`Message updated from ${tempId} to ${serverMessage.id}`);
      });
    } catch (error) {
      console.error(`Failed to update sent message ${tempId}:`, error);
      throw error;
    }
  }
  async getMessages(
    roomId: string,
    options: PageOptionsDto = {},
    messageRepository: MessageRepository,
  ): Promise<CursorPaginatedRes<MessageItemView>> {
    try {

      const { limit = 20 , afterCursor, beforeCursor} = options;

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

      const resultMessages: MessageItemView[] = limitedMessages.map(msg => (
        {        
        id: msg.id,
        content:msg.content,
        type: msg.type as MessageContentType,
        senderId: msg.sender_id,
        roomId: msg.room_id,
        status: msg.status,
        replyMessageId: msg.reply_message_id,
        revoked: msg.revoked,
        createdAt: new Date(msg._raw.created_at),
        updatedAt:new Date( msg._raw.updated_at),
      }));

      
      const endCursor = resultMessages.length > 0 ?
       resultMessages[resultMessages.length - 1].createdAt.getTime() : undefined;
      const startCursor = resultMessages.length > 0 ?
       resultMessages[0].createdAt.getTime() : undefined;
       
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
