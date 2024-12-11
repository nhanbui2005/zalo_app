import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RelationService } from './relation.service';
import { SendRequestToAddFriendReqDto } from './dto/send-request.req.dto';
import { HandleRequestToAddFriendReqDto } from './dto/handle-req.req.dto';
import { Uuid } from '@/common/types/common.type';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('relations')
@Controller({
  path: 'relations',
  version: '1',
})
export class RelationController {
  constructor(private readonly relationService: RelationService) {}

  @Post('/sent-request')
  sendRequest(
    @Body() dto: SendRequestToAddFriendReqDto,
    @CurrentUser('id') userId: Uuid
  ) {
    return this.relationService.sendRequest(dto, userId);
  }
  
  @Post('/handle-request')
  handleRequest(@Body() dto: HandleRequestToAddFriendReqDto) {
    return this.relationService.handleRequest(dto);
  }

  

  // @Get()
  // findAll() {
  //   return this.friendService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.friendService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateFriendDto: UpdateFriendDto) {
  //   return this.friendService.update(+id, updateFriendDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.friendService.remove(+id);
  // }
}
