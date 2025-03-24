import axiosInstance from '~/configs/axiosInstance';
import {_MessageSentReq, _MessageSentRes} from './dto/message.dto.parent';
import {
  CursorPaginatedReq,
  CursorPaginatedRes,
} from '../common/pagination/paginationDto';
import {syncNewMessage} from './messageSync';
import {MessageApi} from './messageApi';
import {v4 as uuidv4} from 'uuid';
import MessageRepository from '~/database/repositories/MessageRepository';
import RoomRepository from '~/database/repositories/RoomRepository';

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
  roomRepository: RoomRepository,
  messageRepository: MessageRepository,
): Promise<void> => {
  try {
    // 1. Tạo tin nhắn giả và lưu cục bộ
    const tempId = `temp-${uuidv4()}`;
    const message: Partial<_MessageSentRes> = {
      id: tempId,
      content: dto.content,
      roomId: dto.roomId,
      type: dto.contentType,
      isSelfSent: true,
      replyMessageId: dto.replyMessageId,
      updatedAt: new Date(),
    };
    // 2. Lưu cục bộ trước (cả online/offline)
    await syncNewMessage(
      message,
      roomRepository,
      messageRepository,
    );

    if (true) {
      // 3. Gửi tin nhắn lên server
      const messageRes = await MessageApi.SentMessage(dto);

      

      // 4. Cập nhật tin nhắn với dữ liệu từ server
      await messageRepository.updateSentMessage(
        tempId,
        messageRes,
        messageRepository,
        roomRepository,
      );

     
    } else {
      //actions when offline
    }
  } catch (error: any) {
    throw error;
  }
};

export const MessageService = {
  loadMoreMessage,
  SentMessage,
};
