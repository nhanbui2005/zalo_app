import { MessageContentType } from './message.enum';
import { MemberResDto } from '~/features/room/dto/room.dto.nested';

export interface MessagParente {
  id: string;
  content: string;
  sender: MemberResDto
  type: MessageContentType;
  createdAt: Date;
}
