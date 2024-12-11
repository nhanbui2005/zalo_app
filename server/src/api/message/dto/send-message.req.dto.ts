import { Uuid } from "@/common/types/common.type";
import { MessageContentType } from "@/constants/entity.enum";
import { EnumField, StringField, UUIDField } from "@/decorators/field.decorators";

export class SendMessageReqDto {
  @UUIDField()
  receiverId?: Uuid

  @UUIDField()
  roomId?: Uuid

  @StringField()
  content: string

  @EnumField(()=>MessageContentType)
  contentType: MessageContentType
}
