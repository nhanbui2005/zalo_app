import 'react-native-get-random-values'; 
import MessageRepository from "~/database/repositories/MessageRepository";
import RoomRepository from "~/database/repositories/RoomRepository";
import { nanoid } from 'nanoid/non-secure';
import { _RoomRes } from "../room/dto/room.dto.parent";
import { database } from "~/database";
import { Q } from "@nozbe/watermelondb";
import { MessageContentType, MessageViewStatus } from "../message/dto/message.enum";
import { _MessageSentRes } from "../message/dto/message.dto.parent";
import { RelationStatus } from "./dto/relation.dto.enum";
import MemberRepository from "~/database/repositories/MemberRepository";
import UserRepository from '~/database/repositories/UserRepository';
import { UserBase } from '../user/dto/user.dto.nested';
import { MemberRole } from '~/database/types/member.type';

interface SyncRequestParams {
  room: _RoomRes;
  requesterId: string;
  handlerId: string;
  meId: string,
  memberMeId: string;
  memberId: string;
  userBase: UserBase;
}
export const syncWhenAcceptRequest = async ({
  room,
  requesterId,
  handlerId,
  meId,
  memberMeId,
  memberId,
  userBase,
}: SyncRequestParams): Promise<void> => {
  const msgRepo = MessageRepository.getInstance();
  const roomRepo = RoomRepository.getInstance();
  const memberRepo = MemberRepository.getInstance();
  const userRepo = UserRepository.getInstance(); 
  
  try {
    await database.write(async () => {
      // Kiểm tra bạn bè
      const isFriend = async (userId: string): Promise<boolean> => {
        const friendRecord = await database.get('users').query(
          Q.where('_id', userId),
          Q.where('relation_status', RelationStatus.FRIEND)
        ).fetch();
        return friendRecord.length > 0;
      };

      let messageContent: string | undefined;
      let newUsers: any[] = [];

      if (meId === requesterId) {

        const handlerIsFriend = await isFriend(handlerId);
        if (!handlerIsFriend) {
          messageContent = 'vừa kết bạn';
          newUsers.push({ user: userBase, relationStatus: RelationStatus.FRIEND });
        }
      } else if (meId === handlerId) {
        const requesterIsFriend = await isFriend(requesterId);
        if (!requesterIsFriend) {
          messageContent = 'đã đồng ý kết bạn';
          newUsers.push({ user: userBase, relationStatus: RelationStatus.FRIEND });
        }
      }

      // Nếu có user mới cần thêm, chuẩn bị dữ liệu
      let preparedUsers = newUsers.length > 0 ? await userRepo.prepareUsers(newUsers) : [];

      const roomData: _RoomRes = {
        ...room,
        id: room.id || `temp-${nanoid()}`,
        unReadMsgCount: messageContent ? 1 : 0,
        memberCount: room.memberCount ?? 2,
        lastMsg: messageContent
          ? {
              id: `temp-${nanoid()}`,
              content: messageContent,
              type: MessageContentType.TEXT || 'text',
              status: MessageViewStatus.SENT,
              revoked: false,
              senderName: meId === requesterId ? 'Bạn' : handlerId,
              createdAt: new Date(),
            }
          : undefined,
      };

      const preparedRooms = await roomRepo?.prepareRooms([roomData]);
      const newRoom = preparedRooms[0];      

      const preparedMembers = await memberRepo.prepareMembers(
        [
          { userId: userBase.id, memberId: memberId, role: MemberRole.MEMBER },
          {userId: meId, memberId: memberMeId, role: MemberRole.MEMBER }
        ],
        room.id
      );
          
      if (messageContent) {        
        const pendingMessages: { roomId: string; messages: Partial<_MessageSentRes>[] }[] = [
          {
            roomId: roomData.id,
            messages: [
              {
                id: `temp-${nanoid()}`,
                content: messageContent,
                senderId: '',
                replyMessageId: '',
                roomId: roomData.id,
                type: MessageContentType.TEXT || 'text',
                revoked: false,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
          },
        ];        

        const preparedMessages = await msgRepo.prepareMessages(pendingMessages);

        await database.batch(newRoom, ...preparedMembers, ...preparedMessages, ...preparedUsers);
      } else {
        await database.batch(newRoom, ...preparedMembers, ...preparedUsers);
      }
    });
  } catch (error) {
    console.error('Error syncing new room:', error);
    throw error;
  }
};

