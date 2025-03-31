import { MessageContentType, MessageSource, MessageViewStatus } from "~/features/message/dto/message.enum";
import { UserItemBaseView } from "./user.typee";

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
}

export interface MessageItemDisplay extends MessageItemView {
    isSelfSent: boolean;
    isDisplayTime?: boolean;
    isDisplayHeart?: boolean;
    isDisplayAvatar?: boolean;
    isDisplayStatus?: boolean;
    source: MessageSource;
  }