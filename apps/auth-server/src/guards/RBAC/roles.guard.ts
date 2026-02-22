import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { Role } from '../../../DTO/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are specified, allow access
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request?.user;

    if (!user) {
      throw new ForbiddenException('No user found on request');
    }

    // Accept either `role` or `Role` shape from your JWT/payload
    const userRoleOrRoles = (user.role ?? user.Role) as
      | Role
      | Role[]
      | undefined;

    if (!userRoleOrRoles) {
      throw new ForbiddenException('User has no role assigned');
    }

    // support both single-role and multi-role user payloads
    const allowed = Array.isArray(userRoleOrRoles)
      ? requiredRoles.some((r) => userRoleOrRoles.includes(r))
      : requiredRoles.includes(userRoleOrRoles as Role);

    if (!allowed) {
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}
