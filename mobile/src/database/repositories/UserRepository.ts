import { Collection, Database, Q } from '@nozbe/watermelondb';
import { database } from '~/database';
import UserModel from '../models/UserModel';
import { RelationStatus } from '~/features/relation/dto/relation.dto.enum';
import { UserItemView } from '../types/user.typee';
import { _HandleRequestRes, _SendRequestRes } from '~/features/relation/dto/relation.dto.parent';
import { _UserRes } from '~/features/user/dto/user.dto.parent';
import { FriendStatusSocket } from '~/socket/SocketProvider';
import { map, Observable } from 'rxjs';
import MemberModel from '../models/MemberModel';

export default class UserRepository {
  private usersCollection = database.get<UserModel>('users')
  private membersCollection = database.get<MemberModel>('members')


  getAllUsersObservable(status: RelationStatus): Observable<UserItemView[]> {
    return this.usersCollection
      .query(
        Q.where('relation_status', status),
        Q.sortBy('updated_at', Q.desc))
      .observeWithColumns(['isOnline'])
      .pipe(
        map(users =>
          users.map(user => ({
            id: user._id,
            username: user.username,
            avatarUrl: user.avatarUrl,
            preferredName: user.preferredName,
            relationStatus: user.relationStatus,
            lastedOnline: user.lastOnline, 
            isOnline: user.isOnline,
          }))
        )
      );
  }
  async addUser(userData: _UserRes): Promise<UserModel> {
    return database.write(async () => {
      return await this.usersCollection.create((user) => {
        user._id = userData.id;
        user.username = userData.username || '';
        user.bio = userData.bio || '';
        user.gender = userData.gender || '';
        user.email = userData.email || '';
        user.dob = Number(userData.dob) || Date.now();
        user.avatarUrl = userData.avatarUrl || '';
        user.avatarPid = userData.avatarPid || '';
        user.coverUrl = userData.coverUrl || '';
        user.coverPid = userData.coverPid || '';
        user.isOnline = false;
        user.lastOnline = Date.now();
        user.relationStatus = RelationStatus.FRIEND;
        user.preferredName = '';
      });
    });
  }
  async deleteUser(userId: string): Promise<void> {
    return database.write(async () => {
      const user = await this.usersCollection.find(userId);
      await user.destroyPermanently();
    });
  }
  async getUserById(userId: string): Promise<UserModel[]> {
    return await this.usersCollection.query(Q.where('_id', userId)).fetch();
  }
  async updatePreferredName(userId: string, newPreferredName: string): Promise<void> {
    await database.write(async () => {
      const user = await this.usersCollection.find(userId);
      await user.update((userRecord: UserModel) => {
        userRecord.preferredName = newPreferredName;
      });
    });
  }
  async updateRelationStatus(userId: string, newStatus: RelationStatus): Promise<void> {
    await database.write(async () => {
      const user = await this.usersCollection.find(userId);
      await user.update((userRecord: UserModel) => {
        userRecord.relationStatus = newStatus;
      });
    });
  }
  async updateOnlineStatus(friendStatus: FriendStatusSocket): Promise<void> {
    const { userId, isOnline, lastOnline } = friendStatus
    await database.write(async () => {
      const user = await this.usersCollection.find(userId);
      await user.update((userRecord: UserModel) => {
        userRecord.isOnline = isOnline;
        userRecord.lastOnline = Number(lastOnline);
      });
    });
  }
  async prepareUsers(userWithRelations: { user: _UserRes; relationStatus: RelationStatus }[]): Promise<UserModel []> {
    // Lấy danh sách user IDs từ mảng pending
    const userIds = userWithRelations.map(item => item.user.id);
    const existingUsers = await this.usersCollection
      .query(Q.where('_id', Q.oneOf(userIds)))
      .fetch();
  
    // Tạo map để tra cứu nhanh các user hiện có
    const existingUserMap = new Map<string, UserModel>(
      existingUsers.map(user => [user._id, user])
    );
  
    // Chuẩn bị records cho từng item trong pending
    const preparedRecords = userWithRelations.map(item => {
      const userData = item.user;
      const relationStatus = item.relationStatus;
      const existingUser = existingUserMap.get(userData.id);
  
      if (existingUser) {
        // Chuẩn bị cập nhật user hiện có
        return existingUser.prepareUpdate((userRecord: UserModel) => {
          userRecord.username = userData.username || existingUser.username;
          userRecord.bio = userData.bio || existingUser.bio;
          userRecord.gender = userData.gender || existingUser.gender;
          userRecord.email = userData.email || existingUser.email;
          userRecord.dob = Number(userData.dob) || existingUser.dob;
          userRecord.avatarUrl = userData.avatarUrl || existingUser.avatarUrl;
          userRecord.avatarPid = userData.avatarPid || existingUser.avatarPid || '';
          userRecord.coverUrl = userData.coverUrl || existingUser.coverUrl || '';
          userRecord.coverPid = userData.coverPid || existingUser.coverPid || '';
          userRecord.relationStatus = relationStatus; // Sử dụng relationStatus từ item
        });
      } else {
        // Chuẩn bị thêm user mới
        return this.usersCollection.prepareCreate((user: UserModel) => {
          user._id = userData.id;
          user.username = userData.username || '';
          user.bio = userData.bio || '';
          user.gender = userData.gender || '';
          user.email = userData.email || '';
          user.dob = Number(userData.dob) || Date.now();
          user.avatarUrl = userData.avatarUrl || '';
          user.avatarPid = userData.avatarPid || '';
          user.coverUrl = userData.coverUrl || '';
          user.coverPid = userData.coverPid || '';
          user.relationStatus = relationStatus; 
          user.preferredName = '';
        });
      }
    });
    return preparedRecords;
  }
  async batchUsers(preparedUsers: UserModel [], insideTransaction = true): Promise<void> {
    const writeFn = async () => {
      await database.batch(...preparedUsers);
    };
  
    if (insideTransaction) {
      await database.write(writeFn);
    } else {
      await writeFn();
    }
  }
  async getMapUsersByRoomId(roomId: string): Promise<Map<string, UserModel>> {
    try {
      // Bước 1: Lấy danh sách user_id thuộc roomId từ bảng members
      const members = await this.membersCollection
        .query(Q.where('room_id', roomId))
        .fetch();
  
      // Bước 2: Trích xuất userIds từ members và lọc bỏ giá trị không hợp lệ
      const userIds = members.map(member => member.userId).filter(Boolean);
  
      if (userIds.length === 0) {
        return new Map<string, UserModel>(); // Trả về Map rỗng nếu không có user
      }
  
      // Bước 3: Lấy danh sách users từ bảng users với các userIds
      const users = await this.usersCollection
        .query(Q.where('_id', Q.oneOf(userIds)))
        .fetch();
  
      // Bước 4: Chuyển danh sách users thành Map với key là _id, chỉ giữ các trường cần thiết
      const usersMap = new Map<string, UserModel>();
      users.forEach(user => {
        usersMap.set(user._id, user);
      });
  
      return usersMap;
    } catch (error) {
      console.error(`Error fetching users for roomId=${roomId}:`, error);
      throw error;
    }
  }
}