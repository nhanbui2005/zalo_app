import axiosInstance from '~/configs/axiosInstance';
import {
  _SendRequestReq,
  _SendRequestRes,
  _HandleRequestReq,
  _HandleRequestRes,
} from './dto/relation.dto.parent';
import { RelationStatus } from './dto/relation.dto.enum';
import { Relation } from './dto/relation.dto.nested';

const sendRequest = async (dto: _SendRequestReq): Promise<_SendRequestRes> => {
  try {
    const response = await axiosInstance.post('relations/sent-request', {
      receiverId: dto.receiverId,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error sending request:', error);
    throw new Error('Failed to send request');
  }
};
const getRelations = async (status: RelationStatus): Promise<Relation[]> => {
  try {    
    const response = await axiosInstance.get('relations', {
      params: { status: status },
    });
    console.log(response);
    
    if (!Array.isArray(response)) {
      return []
    }

    return response;
  } catch (error: any) {
    return []
    
  }
};

const handleRequest = async (dto: _HandleRequestReq): Promise<_HandleRequestRes> => {
  try {
    return await axiosInstance.post('relations/handle-request', dto);
  } catch (error: any) {
    console.error('Error handling request:', error);
    throw new Error('Failed to handle request'); 
  }
};


export const relationApi = {
  sendRequest,
  getRelations,
  handleRequest,
};
