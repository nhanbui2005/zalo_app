import { Controller, Get, Post, Body, Param, Delete, Query, UseInterceptors, BadRequestException, UploadedFile } from '@nestjs/common';
import { MessageService } from './message.service';
import { ApiTags } from '@nestjs/swagger';
import { SendMessageReqDto } from './dto/send-message.req.dto';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { Uuid } from '@/common/types/common.type';
import { CursorPaginatedDto } from '@/common/dto/cursor-pagination/paginated.dto';
import { LoadMoreMessagesReqDto } from './dto/load-more-messages.req.dto';
import { MessageResDto } from './dto/message.res.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { LoadMessagesFromReqDto } from './dto/load-messages-from.req.dto';
import { DetailMessageReqDto } from './dto/get-detail-message-req.dto';
import { RedisService } from '@/redis/redis.service'
import { createCacheKey } from '@/utils/cache.util';
import { CacheKey } from '@/constants/cache.constant';
import { MessageContentType } from '@/constants/entity.enum';

@ApiTags('messages')
@Controller({
    path: 'messages',
    version: '1',
})
export class MessageController {
  constructor(
    private readonly redisService: RedisService,
    private readonly messageService: MessageService
  ) {}

  @Post('save-fcm-token')
  async saveFCMToken(@Body() body: { userId: string; token: string }) {
    const { userId, token } = body;
    await this.redisService.set(createCacheKey(CacheKey.FCM_TOKEN, userId), token, 604800); 
    return { message: 'FCM token saved' };
  }

  @Post(':roomId/media')
  @UseInterceptors(
    FileInterceptor('file',{
      limits: { fileSize: 100 * 1024 * 1024 }, // Giới hạn 100MB cho tất cả media
      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = [
          'image/png', 'image/jpeg', 'image/jpg', 'image/gif',
          'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm',
          'application/pdf', 'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
          'application/zip', 'application/x-rar-compressed',
          'application/x-msdownload', 'application/octet-stream'
        ];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return callback(new BadRequestException('Invalid file type'), false);
        }
        callback(null, true);
      },
    })
  )
  sendMessage(
    @Param('roomId') roomId: Uuid,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: SendMessageReqDto,
    @CurrentUser('id') id: Uuid
  ) {
    return this.messageService.sendMessageUnified(roomId, dto, id, file);
  }

  @Post(':roomId/text')
  sendTextMsg(
    @Param('roomId') roomId: Uuid,
    @Body() dto: SendMessageReqDto,
    @CurrentUser('id') id: Uuid
  ) {
    return this.messageService.sendMessageUnified(roomId, dto, id);
  }

  @Get('/detail')
  findDetail(
    @Param('messageId') id: Uuid,
    // Call the message service to handle sending the text message
    @Body() dto: DetailMessageReqDto
  ) {
    return this.messageService.findDetail(id, dto);
  }

  @Get()
  findAll(
    @Query() reqDto: LoadMoreMessagesReqDto,
    @CurrentUser('id') meId: Uuid
  ): Promise<CursorPaginatedDto<MessageResDto>> {
    
    return this.messageService.loadMoreMessage(reqDto, meId);
  }

  @Get('from')
  loadMessagesFrom(
    @Query() reqDto: LoadMessagesFromReqDto,
    @CurrentUser('id') meId: Uuid
  ): Promise<CursorPaginatedDto<MessageResDto>> {
    
    return this.messageService.loadMessageFrom(reqDto, meId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.messageService.findOne(+id);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateMessageDto: UpdateMessageDto) {
  //   return this.messageService.update(+id, updateMessageDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.messageService.remove(+id);
  }
}
