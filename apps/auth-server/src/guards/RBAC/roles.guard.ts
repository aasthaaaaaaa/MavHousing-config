import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "./roles.decorator";
import { Role } from "apps/auth-server/DTO/role.enum";
import { Observable } from "rxjs";

@Injectable()
export class RolesGuard implements CanActivate{
  constructor(private reflector:Reflector){}

  canActivate(context: ExecutionContext): boolean{

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
      ROLES_KEY, [
        context.getHandler(),
        context.getClass()
      ]
    );

    if(!requiredRoles) return true // no specific role was required to execute that

    const request = context.switchToHttp().getRequest();
    const user = request?.user;

    if(!user){
      console.warn('RolesGuard - no user on request; denying access');
      return false;
    }

    // Accept either `role` or legacy `Role` property from JWT payload
    const userRole = (user.role ?? user.Role) as Role | undefined;

    if(!userRole){
      console.warn('RolesGuard - user has no role; denying access', user);
      return false;
    }

    const allowed = requiredRoles.includes(userRole);
    console.log('RolesGuard - requiredRoles:', requiredRoles, 'userRole:', userRole, '| allowed:', allowed);
    return allowed;
  }
}