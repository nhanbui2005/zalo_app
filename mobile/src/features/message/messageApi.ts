import axiosInstance from '~/configs/axiosInstance';
import {_MessageSentReq, _MessageSentRes} from './dto/message.dto.parent';
import { CursorPaginatedReq, CursorPaginatedRes } from '~/features/common/pagination/paginationDto';

const loadMoreMessage= async (dto: CursorPaginatedReq<string>): Promise<CursorPaginatedRes<_MessageSentRes>> => {
  try {
    let query = `roomId=${dto.data}`  

    const afterCursor = dto.pagination.afterCursor
    const beforeCursor = dto.pagination.beforeCursor  

    if (afterCursor) query += `&afterCursor=${afterCursor}`
    if (beforeCursor) query += `&beforeCursor=${afterCursor}`         
      
    return await axiosInstance.get('/messages?'+query)
  } catch (error) {
    console.error('Lỗi khi tải thêm tin nhắn:', error);
    throw error;
  }
}
const SentTextMessage = async (dto: _MessageSentReq)
: Promise<_MessageSentRes> => {
  try {
     const a = await axiosInstance.post(`messages/${dto.roomId}/text`, dto) as _MessageSentRes     
     return a
  } catch (error: any) {
    console.error('Error while sending message:', error);
    throw error;
  }
};

const SentMediaMessage = async (dto: _MessageSentReq)
: Promise<_MessageSentRes> => {
  try {
     const a = await axiosInstance.post(`messages/${dto.roomId}/media`, dto) as _MessageSentRes     
     return a
  } catch (error: any) {
    console.error('Error while sending message:', error);
    throw error;
  }
};


export const MessageApi = {
  loadMoreMessage,
  SentTextMessage,
  SentMediaMessage
}