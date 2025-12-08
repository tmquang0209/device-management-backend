import { PERMISSION_KEY } from '@common/enums';
import { SetMetadata } from '@nestjs/common';

export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSION_KEY, permissions);
