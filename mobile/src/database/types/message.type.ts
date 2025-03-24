import { MessageContentType, MessageSource, MessageViewStatus } from "~/features/message/dto/message.enum";

export interface MessageItemView {
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

export interface MessageItemDisplay extends MessageItemView {
    isSelfSent: boolean;
    isDisplayTime?: boolean;
    isDisplayHeart?: boolean;
    isDisplayAvatar?: boolean;
    isDisplayStatus?: boolean;
    source: MessageSource;
    messageStatus?: MessageViewStatus;
    sender: {
      id: string;
      name: string;
      avatar: string;
    };
  }