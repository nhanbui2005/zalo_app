import { MessageContentType, MessageSource, MessageViewStatus } from "~/features/message/dto/message.enum";
import { UserItemBaseView } from "./user.typee";
import { MediaRes } from "~/features/message/dto/message.dto.parent";

export interface MessageItem {
    id: string,
    content: string,
    senderId: string,
    status: MessageViewStatus,
    replyMessageId?: string,
    type: MessageContentType,
    emojis?: string[],
    revoked: boolean, 
    createdAt: Date; 
}
export interface MessageItemView extends MessageItem {
    sender?: UserItemBaseView
    media?: MediaRes[]
    linkMetadata?: LinkMetadata | null; 
}
interface LinkMetadata {
    thumbnail?: string;
    title?: string;
    description?: string;
    source?: string;
    type?: string
  }
export interface MessageItemDisplay extends MessageItemView {
    isSelfSent: boolean;
    isDisplayTime?: boolean;
    isDisplayHeart?: boolean;
    isDisplayAvatar?: boolean;
    isDisplayStatus?: boolean;
    isDisplayTimeBox?: boolean,
    source: MessageSource;
  }

