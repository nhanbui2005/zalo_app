import {UserBase} from '~/features/user/dto/user.dto.nested';
import { RoomTypeEnum } from './room.enum';
import { _MessageSentRes } from '~/features/message/dto/message.dto.parent';
import { UserEntity } from '~/features/user/userEntity';
import { MessageContentType, MessageViewStatus } from '~/features/message/dto/message.enum';

export interface Room {
  id: string;
  roomAvatar: string;
  roomName: string;
  type: RoomTypeEnum;
  members?: MemberResDto[];
  lastMsg?: LastMsg;
  memberCount?: number
  unReadMsgCount?: number
}
export interface MemberResDto {
  id: string;
  msgRTime: Date;
  msgVTime: Date;
  role: string;
  user: UserEntity;
}

export interface LastMsg {
  id: string ;
  content: string;
  type: MessageContentType;
  revoked: boolean;
  senderName: string;
  status: MessageViewStatus
  createdAt: Date;
}