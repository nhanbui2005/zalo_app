import axiosInstance from '~/configs/axiosInstance';
import {_MessageSentReq, _MessageSentRes} from './dto/message.dto.parent';
import { CursorPaginatedReq, CursorPaginatedRes } from '~/features/common/pagination/paginationDto';
import { Platform } from 'react-native';

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

const SentMediaMessage = async (
  dto: _MessageSentReq,
  files: { uri: string; type: string; fileName: string }[] = []
): Promise<_MessageSentRes> => {
  try {
    const formData = new FormData();

    // Thêm các file vào FormData
    files.forEach((file) => { 
      formData.append('files', {
        uri: Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri,
        type: file.type,
        name: file.fileName, 
      } as any);
    });

    // Thêm các trường dữ liệu khác
    formData.append('roomId', dto.roomId ?? '');
    formData.append('content', dto.content ?? '');
    formData.append('contentType', dto.contentType ?? '');
    if (dto.replyMessageId) {
      formData.append('replyMessageId', dto.replyMessageId ?? '');
    }
    
    // Gửi FormData lên server
    const response = await axiosInstance.post(`messages/${dto.roomId}/media`, formData) as any;

    return response 
  } catch (error: any) {
    console.error('Error while sending media message:', error);
    throw error;
  }
};

export const MessageApi = {
  loadMoreMessage,
  SentTextMessage,
  SentMediaMessage
}