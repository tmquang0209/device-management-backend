import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    console.log(
      '🚀 ~ PermissionGuard ~ canActivate ~ context:',
      context.getType(),
    );
    return true;
  }
}
