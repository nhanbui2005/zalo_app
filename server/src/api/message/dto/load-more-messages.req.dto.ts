import { PageOptionsDto } from '@/common/dto/cursor-pagination/page-options.dto';
import { Uuid } from '@/common/types/common.type';
import { UUIDField } from '@/decorators/field.decorators';

export class LoadMoreMessagesReqDto extends PageOptionsDto {
  @UUIDField()
  roomId!: Uuid;
}
