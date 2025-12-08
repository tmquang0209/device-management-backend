import {
  EPaymentMethod,
  EPaymentStatus,
  EReconciliationStatus,
} from '@common/enums';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from 'src/generated/i18n.generated';
import { PaginationRequestDto, PaginationResponseDto } from './pagination.dto';

// ============================================
// PAYMENT PROVIDER DTOs
// ============================================

export class PaymentProviderInfoDto {
  @IsUUID()
  id: string;

  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  @IsString()
  authorizedKey?: string;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;
}

export class CreatePaymentProviderDto {
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  code: string;

  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  name: string;

  @IsOptional()
  @IsBoolean({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_boolean',
    ),
  })
  isActive?: boolean;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  authorizedKey?: string;
}

export class UpdatePaymentProviderDto extends CreatePaymentProviderDto {
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
    ),
  })
  id: string;
}

export class PaymentProviderListRequestDto extends PaginationRequestDto {
  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  code?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  name?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;
}

export class PaymentProviderListResponseDto extends PaginationResponseDto<PaymentProviderInfoDto> {}

// ============================================
// PAYMENT TRANSACTION DTOs
// ============================================

export class PaymentTransactionInfoDto {
  id: string;
  userId?: string;
  providerId: string;
  providerTxnId?: string;
  providerRefId?: string;
  status: EPaymentStatus;
  paymentMethod: EPaymentMethod;
  currency: string;
  amountMinor?: number;
  feeMinor?: number;
  netMinor?: number;
  description?: string;
  idempotencyKey?: string;
  webhookSignatureOk: boolean;
  settlementDate?: Date;
  statementId?: string;
  reconStatus: EReconciliationStatus;
  refundData?: Record<string, any>;
  parentTxnUid?: string;
  refundReason?: string;
  expiredAt?: Date;
  paidAt?: Date;
  refundedAt?: Date;
  lastWebhookAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class CreatePaymentTransactionDto {
  @IsOptional()
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
    ),
  })
  userId?: string;

  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
    ),
  })
  providerId: string;

  @Transform(({ value }) => Number(value))
  @IsNumber(
    {},
    {
      message: i18nValidationMessage<I18nTranslations>(
        'common.validation.must_be_number',
      ),
    },
  )
  amountMinor: number;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  currency: string = 'VND';

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  description?: string;

  @IsOptional()
  @IsEnum(EPaymentMethod, {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.in_array',
      { values: Object.values(EPaymentMethod).join(', ') },
    ),
  })
  paymentMethod?: EPaymentMethod;
}

export class UpdatePaymentTransactionDto extends CreatePaymentTransactionDto {
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
    ),
  })
  id: string;

  @IsOptional()
  @IsEnum(EPaymentStatus, {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.in_array',
      { values: Object.values(EPaymentStatus).join(', ') },
    ),
  })
  status?: EPaymentStatus;

  @IsOptional()
  @IsEnum(EReconciliationStatus, {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.in_array',
      { values: Object.values(EReconciliationStatus).join(', ') },
    ),
  })
  reconStatus?: EReconciliationStatus;
}

export class PaymentTransactionListRequestDto extends PaginationRequestDto {
  @IsOptional()
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
    ),
  })
  userId?: string;

  @IsOptional()
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
    ),
  })
  providerId?: string;

  @IsOptional()
  @IsEnum(EPaymentStatus, {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.in_array',
      { values: Object.values(EPaymentStatus).join(', ') },
    ),
  })
  status?: EPaymentStatus;

  @IsOptional()
  @IsEnum(EPaymentMethod, {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.in_array',
      { values: Object.values(EPaymentMethod).join(', ') },
    ),
  })
  paymentMethod?: EPaymentMethod;

  @IsOptional()
  @IsEnum(EReconciliationStatus, {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.in_array',
      { values: Object.values(EReconciliationStatus).join(', ') },
    ),
  })
  reconStatus?: EReconciliationStatus;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  providerTxnId?: string;
}

export class PaymentTransactionListResponseDto extends PaginationResponseDto<PaymentTransactionInfoDto> {}

// ============================================
// WEBHOOK DTOs
// ============================================

export class SepayWebhookDto {
  @IsNumber()
  readonly id: number;

  @IsString()
  readonly gateway: string;

  @IsString()
  readonly transactionDate: string;

  @IsString()
  readonly accountNumber: string;

  @IsOptional()
  @IsString()
  readonly code: string | null;

  @IsString()
  readonly content: string;

  @IsString()
  readonly transferType: 'in' | 'out';

  @IsNumber()
  readonly transferAmount: number;

  @IsNumber()
  readonly accumulated: number;

  @IsOptional()
  @IsString()
  readonly subAccount: string | null;

  @IsString()
  readonly referenceCode: string;

  @IsOptional()
  @IsString()
  readonly description: string;
}
