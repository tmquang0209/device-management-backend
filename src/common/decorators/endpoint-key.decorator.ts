import { ENDPOINT_KEY } from '@common/enums';
import { SetMetadata } from '@nestjs/common';

export const EndpointKey = (key: string) => SetMetadata(ENDPOINT_KEY, key);
