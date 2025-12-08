import {
  AllowUnauthorized,
  Audit,
  EndpointKey,
  PaymentWebhook,
  Permissions,
  ResponseMessage,
} from '@common/decorators';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import {
  BasicInfoDto,
  CreatePaymentProviderDto,
  CreatePaymentTransactionDto,
  PaymentProviderListRequestDto,
  PaymentTransactionListRequestDto,
  SepayWebhookDto,
  UpdatePaymentProviderDto,
  UpdatePaymentTransactionDto,
} from '@dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from 'src/generated/i18n.generated';
import { PaymentService } from './payment.service';
import { SepayService } from './sepay.service';

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly sepayService: SepayService,
  ) {}

  @Get()
  getPayments() {
    return { message: 'Payment methods available' };
  }

  // ============================================
  // PAYMENT PROVIDERS
  // ============================================

  @Audit({
    action: 'create',
    resourceType: 'PaymentProvider',
    captureDiff: true,
  })
  @EndpointKey('payment.providers_create')
  @Permissions('payment.providers_create')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('payment.create.success'),
  )
  @Post('providers')
  createProvider(@Body() createDto: CreatePaymentProviderDto) {
    return this.paymentService.createProvider(createDto);
  }

  @EndpointKey('payment.providers_list')
  @Permissions('payment.providers_list')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('payment.list.success'),
  )
  @Get('providers')
  findAllProviders(@Query() query: PaymentProviderListRequestDto) {
    return this.paymentService.findAllProviders(query);
  }

  @EndpointKey('payment.providers_info')
  @Permissions('payment.providers_info')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('payment.details.success'),
  )
  @Get('providers/:id')
  findOneProvider(@Param('id') id: string) {
    return this.paymentService.findOneProvider(id);
  }

  @Audit({
    action: 'update',
    resourceType: 'PaymentProvider',
    captureDiff: true,
  })
  @EndpointKey('payment.providers_update')
  @Permissions('payment.providers_update')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('payment.update.success'),
  )
  @Put('providers')
  updateProvider(@Body() data: UpdatePaymentProviderDto) {
    return this.paymentService.updateProvider(data);
  }

  @Audit({
    action: 'delete',
    resourceType: 'PaymentProvider',
    captureDiff: true,
  })
  @EndpointKey('payment.providers_delete')
  @Permissions('payment.providers_delete')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('payment.delete.success'),
  )
  @Delete('providers/:id')
  removeProvider(@Param('id') id: string) {
    return this.paymentService.removeProvider(id);
  }

  // ============================================
  // PAYMENT TRANSACTIONS
  // ============================================

  @Audit({
    action: 'create',
    resourceType: 'PaymentTransaction',
    captureDiff: true,
  })
  @EndpointKey('payment.transactions_create')
  @Permissions('payment.transactions_create')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>(
      'payment.transaction.create.success',
    ),
  )
  @Post('transactions')
  createTransaction(
    @Body() createDto: CreatePaymentTransactionDto,
    @CurrentUser() user: BasicInfoDto,
  ) {
    return this.paymentService.createTransaction({
      ...createDto,
      userId: user.id,
    });
  }

  @EndpointKey('payment.transactions_list')
  @Permissions('payment.transactions_list')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('payment.transaction.list.success'),
  )
  @Get('transactions')
  findAllTransactions(@Query() query: PaymentTransactionListRequestDto) {
    return this.paymentService.findAllTransactions(query);
  }

  @EndpointKey('payment.transactions_info')
  @Permissions('payment.transactions_info')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>(
      'payment.transaction.details.success',
    ),
  )
  @Get('transactions/:id')
  findOneTransaction(@Param('id') id: string) {
    return this.paymentService.findOneTransaction(id);
  }

  @Audit({
    action: 'update',
    resourceType: 'PaymentTransaction',
    captureDiff: true,
  })
  @EndpointKey('payment.transactions_update')
  @Permissions('payment.transactions_update')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>(
      'payment.transaction.update.success',
    ),
  )
  @Put('transactions/:id')
  updateTransaction(
    @Param('id') id: string,
    @Body() data: UpdatePaymentTransactionDto,
    @CurrentUser() user: BasicInfoDto,
  ) {
    return this.paymentService.updateTransaction({
      ...data,
      id,
      userId: user.id,
    });
  }

  // ============================================
  // WEBHOOKS
  // ============================================
  @AllowUnauthorized()
  @Audit({
    action: 'webhook',
    resourceType: 'PaymentTransaction',
    captureDiff: true,
    includeBody: true,
  })
  @EndpointKey('payment.sepay_webhook')
  @PaymentWebhook({
    provider: 'SEPAY',
    headerKey: 'Authorization',
    prefix: 'Apikey',
  })
  @Post('sepay/webhook')
  handleSepayWebhook(@Body() payload: SepayWebhookDto) {
    return this.sepayService.handleWebhook(payload);
  }
}
