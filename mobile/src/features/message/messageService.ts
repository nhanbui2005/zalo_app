import axiosInstance from '~/configs/axiosInstance';
import {_MessageSentReq, _MessageSentRes, MediaRes} from './dto/message.dto.parent';
import {
  CursorPaginatedReq,
  CursorPaginatedRes,
} from '../common/pagination/paginationDto';
import {syncNewMessage} from './messageSync';
import {MessageApi} from './messageApi';
import MessageRepository from '~/database/repositories/MessageRepository';
import RoomRepository from '~/database/repositories/RoomRepository';
import { nanoid } from 'nanoid/non-secure';
import { MessageViewStatus } from './dto/message.enum';
import { MediaRepository } from '~/database/repositories/MediaRepository';
import { MediaStatus } from '~/database/types/media.types';
import { database } from '~/database';
import MediaModel from '~/database/models/MediaModel';
import { LinkRepository } from '~/database/repositories/LinkRepository';
import { Q } from '@nozbe/watermelondb';

export interface File {
  uri: string;
  type: string;
  fileName: string;
  bytes: number;
  duration?: number;
}
// const SentMessageText = async (
//   dto: _MessageSentReq,
//   memberMyId: string,
// ): Promise<void> => {
//   const roomRepository = RoomRepository.getInstance()
//   const messageRepository = MessageRepository.getInstance()
//   const mediaRepository = MediaRepository.getInstance()

//   try {    
//     // 1. Tạo tin nhắn giả và lưu cục bộ
//     const tempId = `temp-${nanoid()}`;
//     const message: Partial<_MessageSentRes> = {
//       id: tempId,
//       content: dto.content,
//       roomId: dto.roomId,
//       type: dto.contentType,
//       senderId: memberMyId.trim(),
//       isSelfSent: true,
//       status: MessageViewStatus.SENDING,
//       replyMessageId: dto.replyMessageId,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     };
    
//     // 2. Lưu cục bộ trước (cả online/offline)
//     await syncNewMessage(
//       message,
//       roomRepository,
//       messageRepository,
//     );

//     if (true) {
//       // 3. Gửi tin nhắn lên server
//       const messageRes = await MessageApi.SentTextMessage(dto);         
         
//       // 4. Cập nhật tin nhắn với dữ liệu từ server
//       await messageRepository.updateSentMessage(
//         tempId,
//         messageRes,
//         messageRepository,
//         mediaRepository
//       );
//     } 
//   } catch (error: any) {
//     throw error;
//   }
// };

const loadMoreMessage = async (
  dto: CursorPaginatedReq<string>,
): Promise<CursorPaginatedRes<_MessageSentRes>> => {
  try {
    let query = `roomId=${dto.data}`;

    const afterCursor = dto.pagination.afterCursor;
    const beforeCursor = dto.pagination.beforeCursor;

    if (afterCursor) query += `&afterCursor=${afterCursor}`;
    if (beforeCursor) query += `&beforeCursor=${afterCursor}`;

    return await axiosInstance.get('/messages?' + query);
  } catch (error) {
    console.error('Lỗi khi tải thêm tin nhắn:', error);
    throw error;
  }
};

const SentMessage = async (
  dto: _MessageSentReq,
  memberMyId: string,
  files: File[] = []
): Promise<void> => {
  const linkRepository = LinkRepository.getInstance();
  const roomRepository = RoomRepository.getInstance();
  const messageRepository = MessageRepository.getInstance();
  const mediaRepository = MediaRepository.getInstance(); // Khởi tạo MediaRepository

  const tempId = `temp-${nanoid()}`;
  const message: Partial<_MessageSentRes> = {
    id: tempId,
    content: dto.content,
    roomId: dto.roomId,
    type: dto.contentType,
    senderId: memberMyId.trim(),
    isSelfSent: true,
    replyMessageId: dto.replyMessageId,
    createdAt: new Date(),
    updatedAt: new Date(),
    media: [], // media sẽ được cập nhật sau khi gửi
  };
console.log('......', files);

  // Tạo các media tạm thời và chuẩn bị chúng để lưu
  const tempMedias = files.map((file) => ({
    id: `temp-media-${nanoid()}`,
    status: MediaStatus.PENDING, 
    originalName: file.fileName,
    bytes: file.bytes,
    downloadProgress: 0,
    localPath: file.uri, 
    errorMessage: null,
    messageId: message.id,
    duration: file.duration || 0,
  }));
console.log('tempMedias', tempMedias );

  try {
    // Gộp lưu tạm media và tin nhắn vào một transaction
    await database.write(async () => {
      const mediaRecords = await Promise.all(
        tempMedias.map(media => mediaRepository.prepareMedia(media as any))
      );
      // Lọc bỏ những phần tử undefined nếu có
      const validRecords = mediaRecords.filter((item): item is MediaModel => item !== undefined);
      await mediaRepository.batch(validRecords, false);

      // Kiểm tra xem nội dung có chứa link hay không
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const match = dto.content?.match(urlRegex);
      if (match) {
        const url = match[0];
        // Lưu metadata của link
        await linkRepository.addLinkMetadata(tempId, dto.roomId, url);
      }
    }, 'SaveTempMessageAndMedia');
    
    await syncNewMessage(message, roomRepository, messageRepository); // Gọi trực tiếp, không cần callWriter

    // Gửi lên server
    const messageRes = await MessageApi.SentMediaMessage(dto, files);

    // Gộp cập nhật tin nhắn và media vào một transaction
    await database.write(async () => {
      await messageRepository.updateSentMessage(tempId, messageRes, messageRepository, mediaRepository);

      // Cập nhật messageId trong link_metadata từ tempId sang ID thật
      const linkRecords = await database.get('links').query(Q.where('message_id', tempId)).fetch();
      for (const record of linkRecords) {
        await record.update((link: any) => {
          link.messageId = messageRes.id;
        });
      }

      if (messageRes.media && messageRes.media.length > 0) {
        for (let i = 0; i < messageRes.media.length; i++) {
          const tempMedia = tempMedias[i];
          const mediaDataFromServer = messageRes.media[i];
          await mediaRepository.updateFullMediaDetails(tempMedia.id, mediaDataFromServer);
        }
      }
    }, 'UpdateMessageAndMedia');
  } catch (error: any) {
    await database.write(async () => {
      // Cập nhật trạng thái của tất cả media liên quan
      for (const media of tempMedias) {
        await mediaRepository.updateMediaStatus(
          media.id,
          MediaStatus.ERROR,
          error.message || 'Gửi file thất bại',
          0 // Reset progress về 0
        );
      }
    });
    throw error;
  }
};


export const MessageService = {
  loadMoreMessage,
  // SentMessageText,
  SentMessage
};
