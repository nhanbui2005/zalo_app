import { Collection, Database, Q } from '@nozbe/watermelondb';
import { database } from '~/database';
import UserModel from '../models/UserModel';
import { RelationStatus } from '~/features/relation/dto/relation.dto.enum';
import { UserItemBaseView, UserItemView } from '../types/user.typee';
import { _HandleRequestRes, _SendRequestRes } from '~/features/relation/dto/relation.dto.parent';
import { _UserRes } from '~/features/user/dto/user.dto.parent';
import { map, Observable } from 'rxjs';
import MemberModel from '../models/MemberModel';
import { MemberStatus } from '~/features/user/dto/user.dto.nested';

export default class UserRepository {
  private static instance: UserRepository; // Lưu instance duy nhất
  private usersCollection = database.get<UserModel>('users')
  private membersCollection = database.get<MemberModel>('members')

  private constructor() {} // Chặn việc tạo instance từ bên ngoài

  static getInstance(): UserRepository {
    if (!UserRepository.instance) {
      UserRepository.instance = new UserRepository();
    }
    return UserRepository.instance;
  }

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
        user.dob = Number(new Date(userData.dob)) || Date.now();
        user.avatarUrl = userData.avatarUrl || '';
        user.coverUrl = userData.coverUrl || '';
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
  async updateUserStatus(userId: string, updates: { isOnline: boolean; lastOnline: number }) {
    await this.usersCollection.database.write(async () => {
      try {
        const user = await this.usersCollection.find(userId);
        await user.update((userRecord: any) => {
          userRecord.isOnline = updates.isOnline;
          userRecord.lastOnline = updates.lastOnline;
        });
      } catch (error) {
        throw new Error(`Lỗi khi cập nhật trạng thái user ${userId}: ${error}`);
      }
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
          userRecord.dob = Number(new Date(userData.dob)) || existingUser.dob;
          userRecord.avatarUrl = userData.avatarUrl || existingUser.avatarUrl;
          userRecord.coverUrl = userData.coverUrl || existingUser.coverUrl || '';
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
          user.dob = Number(new Date(userData.dob)) || Date.now();
          user.avatarUrl = userData.avatarUrl || '';
          user.coverUrl = userData.coverUrl || '';
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
  async getMapUsersByRoomId(roomId: string): Promise<Map<string, UserItemBaseView>> {
    try {
      // Bước 1: Lấy danh sách user_id thuộc roomId từ bảng members
      const members = await this.membersCollection
        .query(Q.where('room_id', roomId))
        .fetch();
  
      // Bước 2: Trích xuất userIds từ members và lọc bỏ giá trị không hợp lệ
      const userIds = members.map(member => member.userId).filter(Boolean);
  
      if (userIds.length === 0) {
        return new Map<string, UserItemBaseView>(); 
      }
  
      // Bước 3: Lấy danh sách users từ bảng users với các userIds
      const rawUsers = await this.usersCollection
        .query(Q.where('_id', Q.oneOf(userIds)))
        .fetch();

        const usersMap = new Map<string, UserItemBaseView>();

        rawUsers.forEach((user, index) => {
          usersMap.set(members[index]._id, {
            id: user.id,
            username: user.username,
            avatarUrl: user.avatarUrl,
            preferredName: user.preferredName
          });
        });
  
      return usersMap
    } catch (error) {
      console.error(`Error fetching users for roomId=${roomId}:`, error);
      throw error;
    }
  }
  
}