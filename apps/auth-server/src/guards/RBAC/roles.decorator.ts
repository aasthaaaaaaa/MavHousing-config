import { SetMetadata } from '@nestjs/common';
import { Role } from '../../../DTO/role.enum';

export const ROLES_KEY = 'roles';
export const RoleRequired = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
