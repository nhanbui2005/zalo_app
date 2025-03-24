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


export const syncWhenAcceptRequest = async (
  room: _RoomRes,
  requesterId: string,
  handlerId: string,
  meId: string,
): Promise<void> => {

  const msgRepo = new MessageRepository();
  const roomRepo =new RoomRepository();
  const memberRepo =new MemberRepository();

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

      if (meId === requesterId) {
        const handlerIsFriend = await isFriend(requesterId);
        if (!handlerIsFriend) {
          messageContent = 'Vừa kết bạn';
        }
      } else if (meId === handlerId) {
        const requesterIsFriend = await isFriend(handlerId);
        if (!requesterIsFriend) {
          messageContent = 'Đã đồng ý kết bạn';
        }
      }

      const roomData: _RoomRes = {
        ...room,
        id: room.id || `temp-${nanoid()}`,
        unReadMsgCount: messageContent ? 1 : 0,
        memberCount: room.memberCount ?? 2,
        lastMsg: messageContent
          ? {
              id: `temp-${nanoid()}`,
              content: messageContent,
              type: MessageContentType.TEXT,
              status: MessageViewStatus.SENT,
              revoked: false,
              senderName: meId === requesterId ? 'Bạn' : handlerId,
              createdAt: new Date(),
            }
          : undefined,
      };

      const preparedRooms = await roomRepo?.prepareRooms([roomData]);
      const newRoom = preparedRooms[0];

      const userIds = [requesterId, handlerId];
      const preparedMembers = await memberRepo.prepareMembers(roomData.id, userIds, ['member']);

      if (messageContent) {
        const pendingMessages: { roomId: string; messages: Partial<_MessageSentRes>[] }[] = [
          {
            roomId: roomData.id,
            messages: [
              {
                id: `temp-${nanoid()}`,
                content: messageContent,
                senderId: meId,
                replyMessageId: '',
                roomId: roomData.id,
                type: MessageContentType.TEXT,
                status: MessageViewStatus.SENT,
                revoked: false,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
          },
        ];

        const preparedMessages = await msgRepo.prepareMessages(pendingMessages);
        await database.batch(newRoom, ...preparedMembers, ...preparedMessages);
      } else {
        await database.batch(newRoom, ...preparedMembers);
      }
    });
  } catch (error) {
    console.error('Error syncing new room:', error);
    throw error;
  }
};
