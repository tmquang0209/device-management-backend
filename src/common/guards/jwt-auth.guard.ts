import { ALLOW_UNAUTHORIZED_KEY } from '@common/enums';
import { BasicInfoDto } from '@dto/auth.dto';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: `${process.env.JWT_SECRET}`,
    });
  }

  validate(payload: any) {
    return payload;
  }
}

@Injectable()
export class JwtGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowUnauthorized = this.reflector.getAllAndOverride<boolean>(
      ALLOW_UNAUTHORIZED_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (allowUnauthorized) {
      return true;
    }

    return super.canActivate(context) as Promise<boolean>;
  }

  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }

    const req = context
      .switchToHttp()
      .getRequest<Request & { user: BasicInfoDto }>();

    req.user = user;
    return user;
  }
}
