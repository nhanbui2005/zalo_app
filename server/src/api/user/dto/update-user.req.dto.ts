import { OmitType } from '@nestjs/mapped-types';
import { CreateUserReqDto } from './create-user.req.dto';

export class UpdateUserReqDto extends OmitType(CreateUserReqDto, [
  'roles',
  'email',
] as const) {}