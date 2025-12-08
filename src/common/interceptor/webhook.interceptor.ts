import { PAYMENT_WEBHOOK_KEY } from '@common/enums';
import { PaymentProviderEntity } from '@entities';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/sequelize';
import { Observable } from 'rxjs';

@Injectable()
export class WebhookInterceptor implements NestInterceptor {
  private readonly logger = new Logger(WebhookInterceptor.name);
  constructor(
    private readonly reflector: Reflector,
    @InjectModel(PaymentProviderEntity)
    private readonly paymentProviderModel: typeof PaymentProviderEntity,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const providerData: {
      provider: string;
      headerKey?: string;
      prefix?: string;
    } = this.reflector.get<string>(
      PAYMENT_WEBHOOK_KEY,
      context.getHandler(),
    ) as any;
    if (!providerData) {
      // No webhook metadata on this handler — just pass through
      return next.handle();
    }

    // get provider details from DB
    const provider = await this.paymentProviderModel.findOne({
      where: { code: providerData.provider },
    });

    if (!provider) {
      this.logger.warn(`Payment provider ${providerData.provider} not found.`);
      throw new NotFoundException(
        `Payment provider ${providerData.provider} not found.`,
      );
    }

    if (provider.authorizedKey) {
      this.logger.log(
        `Verifying webhook for provider ${providerData.provider}`,
      );
      const http = context.switchToHttp();
      const req = http.getRequest<
        Request & { headers: Record<string, string> }
      >();
      const headerKey = providerData.headerKey || 'x-webhook-key';
      const receivedKey = req.headers[headerKey.toLowerCase()]
        ?.replaceAll(providerData?.prefix ?? '', '')
        .trim();
      if (receivedKey !== provider.authorizedKey) {
        this.logger.warn(
          `Unauthorized webhook request for provider ${providerData.provider}`,
        );
        throw new UnauthorizedException('Unauthorized webhook request');
      }
      this.logger.log(`Webhook verified for provider ${providerData.provider}`);
      // Attach provider to request for further processing in controller
      (req as any).paymentProvider = provider;
      return next.handle();
    }

    this.logger.log(
      `No authorization key set for provider ${providerData.provider}, skipping verification.`,
    );
    // Attach provider to request for further processing in controller
    const http = context.switchToHttp();
    const req = http.getRequest<
      Request & { headers: Record<string, string> }
    >();
    (req as any).paymentProvider = provider;
    return next.handle();
  }
}
