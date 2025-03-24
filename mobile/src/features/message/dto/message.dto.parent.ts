import { MemberResDto } from '~/features/room/dto/room.dto.nested';
import {messageEntity} from '../messageEntity';
import { MessageContentType } from './message.enum';

export interface _MessageSentReq {
  roomId: string;
  content: string;
  contentType: MessageContentType;
  replyMessageId: string,
}
export interface _MessageSentRes
  extends Pick<
    messageEntity,
    'id' | 'content' | 'type' | 'replyMessageId' | 'senderId' | 'roomId'|'status'
  > {
  revoked: boolean;
  sender?: MemberResDto;
  emojis?: string;
  replyMessage?: _MessageSentRes;
  isSelfSent?: boolean;
  createdAt: Date;
  updatedAt: Date
}