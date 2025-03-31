import { Q } from '@nozbe/watermelondb';
import UserModel from '~/database/models/UserModel';
import { UserItemView } from '../types/user.typee';
import MemberModel from '~/database/models/MemberModel';
import { database } from '..';
import { UserBase } from '~/features/user/dto/user.dto.nested';
import { MemberRole } from '../types/member.type';

export default class MemberRepository {
  private static instance: MemberRepository; 

  private membersCollection = database.get<MemberModel>('members');
  private usersCollection = database.get<UserModel>('users');

  private constructor() {} // Chặn việc tạo instance từ bên ngoài

  static getInstance(): MemberRepository {
    if (!MemberRepository.instance) {
      MemberRepository.instance = new MemberRepository();
    }
    return MemberRepository.instance;
  }

  async getUsersInRoomReceivedMessage(
    roomId: string,
    messageCreatedAt: number // Thời điểm để so sánh lastOnline (milliseconds)
  ): Promise<UserItemView[]> {
    try {
      // Bước 1: Lấy danh sách member trong phòng
      const members = await this.membersCollection
        .query(Q.where('room_id', roomId))
        .fetch();

      // Bước 2: Lấy danh sách user_id từ members
      const userIds = members
        .map(member => member.userId)
        .filter((id): id is string => !!id); 

      if (userIds.length === 0) {
        return [];
      }

      // Bước 3: Truy vấn users với điều kiện: isOnline = true HOẶC lastOnline > messageCreatedAt
      const users = await this.usersCollection
        .query(
          Q.where('_id', Q.oneOf(userIds)), // Lọc theo danh sách user_id
          Q.or(
            Q.where('is_online', true), // isOnline = true
            Q.where('last_online', Q.gt(messageCreatedAt)) // lastOnline > messageCreatedAt
          )
        )
        .fetch();

      // Bước 4: Map sang UserItemView
      return users.map(user => ({
        id: user._id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        preferredName: user.preferredName,
        relationStatus: user.relationStatus,
        lastedOnline: user.lastOnline, 
        isOnline: user.isOnline,
      }));
    } catch (error) {
      console.error('Error fetching users in room received message:', error);
      throw error;
    }
  }

  async prepareMembers(membersData: { userId: string; memberId: string; role: string }[], roomId: string): Promise<MemberModel[]> {
    const preparedMembers: MemberModel[] = [];

    for (const { userId, memberId, role } of membersData) {
        // Kiểm tra xem member đã tồn tại chưa
        const existingMember = await this.membersCollection
            .query(
                Q.where('room_id', roomId),
                Q.where('user_id', userId)
            )
            .fetch();

        if (existingMember.length === 0) {
            // Nếu chưa tồn tại, tạo mới
            preparedMembers.push(
                this.membersCollection.prepareCreate((member: MemberModel) => {
                    member._id = memberId;
                    member.roomId = roomId;
                    member.userId = userId;
                    member.role = role || MemberRole.MEMBER;
                    member.msgVTime = 0;
                })
            );
        }
    }

    return preparedMembers;
  }


  async getUsersByRoomId(roomId: string): Promise<Map<string, UserBase>> {
    try {
      // Lấy danh sách member thuộc roomId
      const members = await this.membersCollection
        .query(Q.where('room_id', roomId))
        .fetch();
  
      // Tạo map lưu userId tương ứng với memberId
      const memberUserMap = new Map<string, string>();
      members.forEach(member => {
        if (member.userId) {
          memberUserMap.set(member.id, member.userId);
        }
      });
  
      const userIds = [...new Set(memberUserMap.values())];
  
      if (userIds.length === 0) {
        return new Map();
      }
  
      // Lấy danh sách user theo userIds
      const users = await this.usersCollection
        .query(Q.where('_id', Q.oneOf(userIds)))
        .fetch();
  
      // Chuyển danh sách user thành Map với memberId làm key
      const userMap = new Map<string, UserBase>();
      members.forEach(member => {
        const user = users.find(u => u.id === member.userId);
        if (user) {
          userMap.set(member.id, user);
        }
      });
  
      return userMap;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách user từ roomId:', error);
      throw error;
    }
  }

  async getMemberMeId(roomId: string, userId: string): Promise<string | null> {
    const members = await this.membersCollection
        .query(
            Q.and(
                Q.where('room_id', roomId),
                Q.where('user_id', userId)
            )
        )
        .fetch();      
          
    return members.length > 0 ? members[0]._id : null;
  }

  async getMemberMeIdInAllRoom(userId: string): Promise<string[] | null> {
    const members = await this.membersCollection
      .query(Q.where('user_id', userId))
      .fetch();

    return members.length > 0 ? members.map(member => member._id) : null;
  }
}