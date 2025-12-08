import { ALLOW_UNAUTHORIZED_KEY } from '@common/enums';
import { SetMetadata } from '@nestjs/common';

export const AllowUnauthorized = () =>
  SetMetadata(ALLOW_UNAUTHORIZED_KEY, true);
