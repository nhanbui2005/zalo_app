// utils/storage.ts
import { MMKV } from 'react-native-mmkv';

export const keyMMKVStore = {
  CURENT_MEMBER_ME_ID: 'currentmemberid',
  CURRENT_ROOM_ID: 'currentroomId',
  USER_ID: 'userId',
  LIST_MEMBER_MY_ID: 'listmemberid',

  //
  IS_ALLOW_NOTIFICATION: 'isAllowNotification'
};

// Khởi tạo MMKV chỉ 1 lần
export const storage = new MMKV();

export class MMKVStore {
  // Lưu danh sách member ID vào MMKV (dưới dạng array string)
  static saveMemberIdsToMMKV(memberIds: string[]) {
    storage.set(keyMMKVStore.LIST_MEMBER_MY_ID, JSON.stringify(memberIds));
  }
  static getSetMemberIdsFromMMKV(): Set<string> {
    const memberString = storage.getString(keyMMKVStore.LIST_MEMBER_MY_ID);
    return memberString ? new Set(JSON.parse(memberString)) : new Set();
  }
  static updateMemberIdsInMMKV(newId: string) {
    const currentSet = MMKVStore.getSetMemberIdsFromMMKV(); 
    currentSet.add(newId); // Thêm ID mới
    MMKVStore.saveMemberIdsToMMKV(Array.from(currentSet));
  }
  static setAllowNotification(isAllow: boolean) {
    storage.set(keyMMKVStore.IS_ALLOW_NOTIFICATION, isAllow);
  }
  
  
  static getAllowNotification(): boolean {
    const isAllow = storage.getBoolean(keyMMKVStore.IS_ALLOW_NOTIFICATION);  
    return isAllow !== undefined ? isAllow : true; 
  }
  

  static setCurrentRoomId(roomId: string) {
    storage.set(keyMMKVStore.CURRENT_ROOM_ID, roomId);
  }
  static getCurrentRoomId(): string {
    return storage.getString(keyMMKVStore.CURRENT_ROOM_ID) || "";
  }

  static setCurrentMemberMeId(memberMe: string) {
    storage.set(keyMMKVStore.CURENT_MEMBER_ME_ID, memberMe);
  }
  static getCurrentMemberMeId(): string {
    return storage.getString(keyMMKVStore.CURENT_MEMBER_ME_ID) || "";
  }
}
