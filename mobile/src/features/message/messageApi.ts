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


const SentMessage = async (dto: _MessageSentReq)
: Promise<_MessageSentRes> => {
  try {
    const res = (await axiosInstance.post(`messages/${dto.roomId}/text`, dto));
    return res.data
  } catch (error: any) {
    console.error('Error while sending message:', error);
    throw error;
  }
};


export const MessageApi = {
  loadMoreMessage,
  SentMessage,
}