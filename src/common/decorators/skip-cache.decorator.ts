import { SKIP_CACHE_KEY } from '@common/enums';
import { SetMetadata } from '@nestjs/common';

export const SkipCache = () => SetMetadata(SKIP_CACHE_KEY, true);
