import { CommonModule } from '@common/common.module';
import { DatabaseModule } from '@common/database/database.module';
import { WebhookInterceptor } from '@common/interceptor';
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CacheService, ConfigService } from '@services';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { SepayService } from './sepay.service';

@Module({
  imports: [CommonModule, DatabaseModule],
  controllers: [PaymentController],
  providers: [
    SepayService,
    PaymentService,
    {
      provide: APP_INTERCEPTOR,
      useClass: WebhookInterceptor,
    },
    ConfigService,
    CacheService,
  ],
  exports: [],
})
export class PaymentModule {}
