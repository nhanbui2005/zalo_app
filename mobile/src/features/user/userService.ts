import axiosInstance from '~/configs/axiosInstance';
import { _UserRes, UserSearchRes } from './dto/user.dto.parent';
import { UserFriend } from './dto/user.dto.nested';
import { UserEntity } from './userEntity';

const getCurrentUser = async (): Promise<UserEntity> => {
  try {        
    return await axiosInstance.get('users/me');
  } catch (error: any) {
    throw error; 
  }
}
const searchUserByEmail = async (email: string): Promise<UserSearchRes> => {
  try {    
    return await axiosInstance.get('users/search', {
      params: { email: email },
    });
  } catch (error: any) {
    console.error('Error while searching user:', error);
    throw error; 
  }
};

const getAllFriends = async (): Promise<_UserRes[]> => {
  try {    
    return await axiosInstance.get('users/friends'); 
  } catch (error: any) {
    console.error('Error while searching user:', error);
    throw error; 
  }
};
const findUserById = async (id: string): Promise<UserFriend> => {
  try {    
    return await axiosInstance.get(`users/${id}`);
  } catch (error: any) {
    console.error('Error while searching user:', error);
    throw error; 
  }
}
export const userApi = { 
  searchUserByEmail ,
  getAllFriends,
  findUserById,
  getCurrentUser
};
