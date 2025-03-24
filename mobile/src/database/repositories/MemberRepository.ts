import { Collection, Database, Q } from '@nozbe/watermelondb';
import UserModel from '~/database/models/UserModel';
import { UserItemView } from '../types/user.typee';
import MemberModel from '~/database/models/MemberModel';
import { nanoid } from 'nanoid';
import { database } from '..';

export default class MemberRepository {
  private membersCollection = database.get<MemberModel>('members');
  private usersCollection = database.get<UserModel>('users');

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

  async prepareMembers(roomId: string, userIds: string[], roles: string[] = []): Promise<MemberModel[]> {
    const preparedMembers: MemberModel[] = [];

    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      const role = roles[i] || 'member'; 

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
            member._id = nanoid();
            member.roomId = roomId;
            member.userId = userId;
            member.role = role;
            member.msgVTime = 0; // Mặc định thời gian xem tin nhắn là 0
          })
        );
      } else {
        // Nếu đã tồn tại, có thể cập nhật (tuỳ chọn)
        preparedMembers.push(
          existingMember[0].prepareUpdate((member: MemberModel) => {
            member.role = role;
            member.msgVTime = 0;
          })
        );
      }
    }

    return preparedMembers;
  }

  
}