import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MessageService } from './message.service';
import { ApiTags } from '@nestjs/swagger';
import { SendMessageReqDto } from './dto/send-message.req.dto';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { Uuid } from '@/common/types/common.type';
// import { UpdateMessageDto } from './dto/update-message.dto';

@ApiTags('messages')
@Controller({
    path: 'messages',
    version: '1',
})
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  sendMessage(
    @Body() dto: SendMessageReqDto,
    @CurrentUser('id') id: Uuid
  ) {
    return this.messageService.sendMessage(dto,id);
  }

  @Get()
  findAll() {
    return this.messageService.findAll();
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
