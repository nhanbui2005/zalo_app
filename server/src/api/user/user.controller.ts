import { CursorPaginatedDto } from '@/common/dto/cursor-pagination/paginated.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { Uuid } from '@/common/types/common.type';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiAuth } from '@/decorators/http.decorators';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateUserReqDto } from './dto/create-user.req.dto';
import { ListUserReqDto } from './dto/list-user.req.dto';
import { LoadMoreUsersReqDto } from './dto/load-more-users.req.dto';
import { UserResDto } from './dto/user.res.dto';
import { UserService } from './user.service';
import { Roles } from '@/decorators/roles.decorator';
import { Role } from '@/constants/entity.enum';
import { UpdateCurrentUserReqDto } from './dto/update-current-user.req.dto';
import { UpdateUserByAdminReqDto } from './dto/update-user-by-admin.req.dto';

@ApiTags('users')
@Controller({
  path: 'users',
  version: '1',
})
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiAuth({
    type: UserResDto,
    summary: 'Get current user',
  })
  @Roles(Role.USER, Role.SUPER_ADMIN, Role.ADMIN)
  @Get('me')
  async getCurrentUser(@CurrentUser('id') userId: Uuid): Promise<UserResDto> {
    return await this.userService.findOne(userId);
  }

  @ApiAuth({
    type: UserResDto,
    summary: 'Search user',
  })
  @Roles(Role.USER, Role.SUPER_ADMIN, Role.ADMIN)
  @Get('search')
  async searchUserByEmail(
    @Query() { email },
    @CurrentUser() {id}
  ): Promise<any> {
    return await this.userService.searchUserByEmail(id, email);
  }

  @ApiAuth({
    type: UserResDto,
    summary: 'Update me',
  })
  @Roles(Role.USER, Role.SUPER_ADMIN, Role.ADMIN)
  @Put('me')
  async updateCurrentUser(
    @CurrentUser('id') userId: Uuid,
    @Body() updateCurrentUserDto: UpdateCurrentUserReqDto,
  ): Promise<UserResDto> {
    return await this.userService.updateMe(userId, updateCurrentUserDto);
  }

  @Post()
  @ApiAuth({
    type: UserResDto,
    summary: 'Create user',
    statusCode: HttpStatus.CREATED,
  })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async createUser(
    @Body() createUserDto: CreateUserReqDto,
  ): Promise<UserResDto> {
    return await this.userService.create(createUserDto);
  }

  @Get()
  @ApiAuth({
    type: UserResDto,
    summary: 'List users',
    isPaginated: true,
  })
  @Roles(Role.USER, Role.SUPER_ADMIN, Role.ADMIN)
  async findAllUsers(
    @Query() reqDto: ListUserReqDto,
  ): Promise<OffsetPaginatedDto<UserResDto>> {
    return await this.userService.findAll(reqDto);
  }

  
  @Get('/friends')
  async findAllUserFriends(
    @CurrentUser('id') myId: Uuid
  ): Promise<UserResDto[]> {
    return await this.userService.findAllUserFriends(myId);
  }

  @Get('/load-more')
  @ApiAuth({
    type: UserResDto,
    summary: 'Load more users',
    isPaginated: true,
    paginationType: 'cursor',
  })
  async loadMoreUsers(
    @Query() reqDto: LoadMoreUsersReqDto,
  ): Promise<CursorPaginatedDto<UserResDto>> {
    return await this.userService.loadMoreUsers(reqDto);
  }

  @Get(':id')
  @ApiAuth({ type: UserResDto, summary: 'Find user by id' })
  @ApiParam({ name: 'id', type: 'String' })
  async findUser(@Param('id', ParseUUIDPipe) id: Uuid): Promise<UserResDto> {
    return await this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiAuth({ type: UserResDto, summary: 'Update user' })
  @ApiParam({ name: 'id', type: 'String' })
  updateUser(
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Body() reqDto: UpdateUserByAdminReqDto,
    @CurrentUser('username') updator: string,
  ) {
    return this.userService.update(id, reqDto, updator);
  }

  @Delete(':id')
  @ApiAuth({
    summary: 'Delete user',
    errorResponses: [400, 401, 403, 404, 500],
  })
  @ApiParam({ name: 'id', type: 'String' })
  removeUser(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.userService.remove(id);
  }

  @ApiAuth()
  @Post('me/change-password')
  async changePassword() {
    return 'change-password';
  }
}
