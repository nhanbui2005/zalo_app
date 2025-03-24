import { LastMsg } from "~/features/room/dto/room.dto.nested";
import { RoomTypeEnum } from "~/features/room/dto/room.enum";

export interface RoomItemView {
    id: string; 
    type: RoomTypeEnum;
    roomName: string;
    roomAvatar: string;
    unreadCount: number; 
    lastMsg: LastMsg
  }

export interface RoomDetailView {
    id: string;
    type: RoomTypeEnum;
    groupName: string;
    groupAvatar: string;
    memberCount: number;
}
  