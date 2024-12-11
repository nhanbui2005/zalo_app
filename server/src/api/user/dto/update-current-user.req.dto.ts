import { OmitType } from '@nestjs/mapped-types';
import { CreateUserReqDto } from './create-user.req.dto';

export class UpdateCurrentUserReqDto extends OmitType(CreateUserReqDto, [
  'roles',
  'email',
] as const) {}