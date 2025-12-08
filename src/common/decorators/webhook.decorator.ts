import { PAYMENT_WEBHOOK_KEY } from '@common/enums';
import { SetMetadata } from '@nestjs/common';

export const PaymentWebhook = ({
  provider,
  headerKey = 'x-webhook-key',
  prefix = 'Bearer',
}: {
  provider: string;
  headerKey?: string;
  prefix?: string;
}) => SetMetadata(PAYMENT_WEBHOOK_KEY, { provider, headerKey, prefix });
