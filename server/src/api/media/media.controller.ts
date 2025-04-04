import { Controller, Get, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MediaService } from './media.service';
import { Uuid } from '@/common/types/common.type';

@ApiTags('media')
@Controller({
  path: 'media',
  version: '1',
})
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get(':id')
  findOne(@Param('id') id: Uuid) {
    return this.mediaService.findOne(id);
  }

  @Get('message/:messageId')
  findByMessageId(@Param('messageId') messageId: Uuid) {
    return this.mediaService.findMediaByMessageId(messageId);
  }

  @Delete(':id')
  remove(@Param('id') id: Uuid) {
    return this.mediaService.remove(id);
  }
} 