import { MessagParente } from "./dto/message.dto.nested";
import {  MessageContentType, MessageViewStatus } from "./dto/message.enum";

export interface messageEntity {
    id: string;
    senderId?: string;
    roomId: string;
    content: string;
    subContent?: string;
    type: MessageContentType;
    replyMessageId?: string;
    status?: MessageViewStatus;
};


