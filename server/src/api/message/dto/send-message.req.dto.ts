import { Uuid } from "@/common/types/common.type";
import { MessageContentType } from "@/constants/entity.enum";
import { EnumFieldOptional, StringFieldOptional, UUIDFieldOptional } from "@/decorators/field.decorators";

export class SendMessageReqDto {
  @UUIDFieldOptional()
  receiverId?: Uuid

  @StringFieldOptional({minLength:1, maxLength:100})
  content?: string

  @UUIDFieldOptional()
  replyMessageId: Uuid

  @EnumFieldOptional(()=>MessageContentType)
  contentType: MessageContentType
}
