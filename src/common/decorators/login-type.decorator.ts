import { EAuthLoginType } from '@common/enums';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const AuthLoginType = createParamDecorator(
  (_, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    if (!request?.headers) return EAuthLoginType.CLIENT;
    // validate login type
    if (
      request.headers['x-client'] &&
      ![EAuthLoginType.CLIENT, EAuthLoginType.SYSTEM].includes(
        request.headers['x-client'] as EAuthLoginType,
      )
    ) {
      return AuthLoginType.CLIENT;
    }
    return request.headers['x-client'] || AuthLoginType.CLIENT;
  },
);
