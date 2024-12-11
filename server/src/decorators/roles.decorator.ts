// import { RoleEntity } from '@/api/user/entities/role.entity';
// import { SetMetadata } from '@nestjs/common';

// export const Roles = (...roles: RoleEntity[]): any => SetMetadata('roles', roles);


import { Role } from '@/constants/entity.enum';
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
