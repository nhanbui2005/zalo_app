import { database } from '~/database';
import { Q } from '@nozbe/watermelondb';
import { Room } from '~/features/room/dto/room.dto.nested';
import { RoomItemView } from '~/database/types/room.type';
import RoomModel from '../models/RoomModel';
import MessageModel from '../models/MessageModel'; 
import { switchMap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { nanoid } from 'nanoid';

export default class RoomRepository {
  private static instance: RoomRepository; 
  private roomsCollection = database.get<RoomModel>('rooms');

  private constructor() {} // Chặn việc tạo instance từ bên ngoài

  static getInstance(): RoomRepository {
    if (!RoomRepository.instance) {
      RoomRepository.instance = new RoomRepository();
    }
    return RoomRepository.instance;
  }

  async getRoomById(roomId: string): Promise<Room> {    
    let roomModel
    try {
      const roomDB = await this.roomsCollection.query(Q.where('_id', roomId)).fetch();
      roomModel = roomDB[0];
      
    } catch (error) {
      console.log('lỗi đây', error);
      
    }
    return {
      id: roomId,
      type: roomModel.type,
      roomAvatar: roomModel.roomAvatar,
      roomName: roomModel.roomName,
      lastMsg: undefined,
      unReadMsgCount: roomModel.unreadCount,
      memberCount: roomModel.memberCount
    };
  
  }
  getRoomsWithLastMessageObservable(): Observable<RoomItemView[]> {
    return this.roomsCollection
      .query(Q.sortBy('updated_at', Q.desc))
      .observeWithColumns([
        'last_message_id',
        'updated_at',
        'unread_count',
      ])
      .pipe(
        switchMap(rooms => {
          // Nếu không cần truy vấn messagesCollection, chỉ map dữ liệu từ rooms
          return of(rooms.map(room => {
            // Kiểm tra xem room có lastMessageId không để quyết định lastMsg
            const hasLastMessage = !!room.lastMessageContent;
            return {
              id: room._id,
              type: room.type,
              roomName: room.roomName || '',
              roomAvatar: room.roomAvatar || '',
              unreadCount: room.unreadCount || 0,
              lastMsg: hasLastMessage
                ? {
                    content: room.lastMessageContent || '',
                    type: room.lastMessageType || '',
                    status: room.lastMessageStatus || '',
                    revoked: room.lastMessageRevoked || false,
                    senderName: room.lastMessageSenderName ?? 'Unknown',
                    createdAt: new Date(room.lastMessageCreatedAt)
                  }
                : null,
            } as RoomItemView;
          }));
        })
      );
  }
  async updateRoomLastMessage(
    roomId: string,
    lastMessage: MessageModel | null,
    messageCounts: number,
    insideTransaction = true
  ): Promise<void> {
    if (!lastMessage) {
      return;
    }
  
    const updateFn = async () => {
      const rooms = await this.roomsCollection.query(Q.where('_id', roomId)).fetch();
     
      await rooms[0].update(r => {
        r.lastMessageContent = lastMessage.content || '';
        r.lastMessageType = lastMessage.type || 'text';
        r.lastMessageStatus = lastMessage.status || 'sent';
        r.lastMessageRevoked = lastMessage.revoked ?? false;
        r.lastMessageSenderName = lastMessage.sender?.user?.username || 'unknown';
        r.unreadCount += messageCounts;
        r.lastMessageCreatedAt = Number(new Date(lastMessage.createdAt)) || Number(new Date());
      });      
      console.log(`Cập nhật tin nhắn cuối của phòng ${roomId} thành công.`);
    };
  
    if (insideTransaction) {
      await database.write(updateFn);
    } else {
      await updateFn();
    }
  }
  async resetRoomUnreadCount(roomId: string): Promise<void> {    
    await database.write(async () => {
      const rooms = await this.roomsCollection.query(Q.where('_id', roomId)).fetch();
      if (rooms.length === 0) {
        console.log(`Không tìm thấy phòng với ID ${roomId}`);
        return;
      }
  
      const room = rooms[0];
      await room.update(r => {
        r.unreadCount = 0;
      });
    });
  }
  async prepareRooms(rooms: Room[]): Promise<RoomModel[]> {
    const roomIds = rooms.map(room => room.id);
    const existingRooms = await this.roomsCollection
      .query(Q.where('_id', Q.oneOf(roomIds)))
      .fetch();

    const existingRoomMap = new Map<string, RoomModel>(
      existingRooms.map(room => [room.id, room])
    );

    const preparedRecords = rooms.map(roomData => {
      const existingRoom = existingRoomMap.get(roomData.id);
      if (existingRoom) {
        // Chuẩn bị cập nhật room hiện có
        return existingRoom.prepareUpdate((roomRecord: RoomModel) => {
          roomRecord._id = roomData.id || existingRoom._id;
          roomRecord.type = roomData.type || existingRoom.type;
          roomRecord.roomName = roomData.roomName || existingRoom.roomName;
          roomRecord.roomAvatar = roomData.roomAvatar || existingRoom.roomAvatar;
          roomRecord.unreadCount = roomData.unReadMsgCount ?? existingRoom.unreadCount;
          roomRecord.memberCount = roomData.memberCount || existingRoom.memberCount;
          roomRecord.lastMessageContent = roomData.lastMsg?.content || existingRoom.lastMessageContent;
          roomRecord.lastMessageType = roomData.lastMsg?.type || existingRoom.lastMessageType;
          roomRecord.lastMessageStatus = roomData.lastMsg?.status || existingRoom.lastMessageStatus;
          roomRecord.lastMessageRevoked = roomData.lastMsg?.revoked ?? existingRoom.lastMessageRevoked;
          roomRecord.lastMessageSenderName = roomData.lastMsg?.senderName || existingRoom.lastMessageSenderName;
          roomRecord.lastMessageCreatedAt = roomData.lastMsg?.createdAt.getTime() || existingRoom.lastMessageCreatedAt;
        });
      } else {
        // Chuẩn bị thêm room mới
        return this.roomsCollection.prepareCreate((room: RoomModel) => {
          room._id = roomData.id || nanoid(); 
          room.type = roomData.type || 'personal';
          room.roomName = roomData.roomName || '';
          room.roomAvatar = roomData.roomAvatar || '';
          room.unreadCount = roomData.unReadMsgCount || 0;
          room.memberCount = roomData.memberCount || 0;
          room.lastMessageContent = roomData.lastMsg?.content || '';
          room.lastMessageType = roomData.lastMsg?.type || 'text';
          room.lastMessageStatus = roomData.lastMsg?.status || 'sent';
          room.lastMessageRevoked = roomData.lastMsg?.revoked || false;
          room.lastMessageSenderName = roomData.lastMsg?.senderName || '';
          room.lastMessageCreatedAt = roomData.lastMsg?.createdAt.getTime() || Date.now();
        });
      }
    });

    return preparedRecords;
  }
  async batchRooms(preparedRooms: RoomModel[], insideTransaction: true): Promise<void> {
    const writeFn = async () => {
      await database.batch(...preparedRooms);
    };

    if (insideTransaction) {
      await database.write(writeFn);
    } else {
      await writeFn();
    }
  }
}
