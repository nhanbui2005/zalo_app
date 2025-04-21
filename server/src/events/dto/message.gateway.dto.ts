import { MediaEntity } from '@/api/media/entities/media.entity';
import { MessageEntity } from '@/api/message/entities/message.entity';
import { Uuid } from '@/common/types/common.type';
import { Socket } from 'socket.io';

export interface MessageDataSocket {
  id: string;
  [key: string]: any;
}

export interface NewMessageEvent {
  client: Socket;
  roomId: Uuid;
  onlineUsersRoom: Uuid[];
  offlineUsersRoom: Uuid[];
  msgData: MessageEntity;
  media: MediaEntity[];
  createdAt: Date;
  msgTempId: string
}
