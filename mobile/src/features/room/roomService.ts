import axiosInstance from '~/configs/axiosInstance';
import {_GetAllRoomRes, _RoomRes} from './dto/room.dto.parent';
import { Room } from './dto/room.dto.nested';

const getAllRoom = async (): Promise<Room[]> => {
  try {      
    const res = await axiosInstance.get('rooms');          
    return res.data
  } catch (error: any) {
    console.error('Error get All room', error);
    throw error;
  }
};

const findOneByPartnerId = async (userId: string): Promise<_RoomRes> => {
  return await axiosInstance.get('rooms/partner/'+userId )
};

const getRoomIdById = async (roomId: string): Promise<_RoomRes> => {
  try {    
    return await axiosInstance.get('rooms/'+roomId)
  } catch (error: any) {
    throw error;
  }
}

export const RoomService = {
  getAllRoom,
  getRoomIdById,
  findOneByPartnerId
};