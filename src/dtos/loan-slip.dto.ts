import {
  EEquipmentLoanSlipDetailStatus,
  EEquipmentLoanSlipStatus,
} from '@common/enums';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from 'src/generated/i18n.generated';
import { PaginationRequestDto, PaginationResponseDto } from './pagination.dto';

// ============== Equipment Loan Slip DTOs ==============

export class CreateLoanSlipDto {
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.field_required',
    ),
  })
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
      { property: 'borrowerId' },
    ),
  })
  readonly borrowerId: string;

  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.field_required',
    ),
  })
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
      { property: 'loanerId' },
    ),
  })
  readonly loanerId: string;

  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.field_required',
    ),
  })
  @IsArray({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_array',
      { property: 'deviceIds' },
    ),
  })
  @IsUUID('4', {
    each: true,
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
      { property: 'deviceIds' },
    ),
  })
  readonly deviceIds: string[];
}

export class UpdateLoanSlipDto {
  @IsOptional()
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
      { property: 'borrowerId' },
    ),
  })
  readonly borrowerId?: string;

  @IsOptional()
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
      { property: 'loanerId' },
    ),
  })
  readonly loanerId?: string;

  @IsOptional()
  @IsArray({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_array',
      { property: 'deviceIds' },
    ),
  })
  @IsUUID('4', {
    each: true,
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
      { property: 'deviceIds' },
    ),
  })
  readonly deviceIds?: string[];

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { property: 'note' },
    ),
  })
  readonly note?: string;
}

export class ReturnDeviceItemDto {
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.field_required',
    ),
  })
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
      { property: 'deviceId' },
    ),
  })
  readonly deviceId: string;

  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.field_required',
    ),
  })
  readonly status: EEquipmentLoanSlipDetailStatus; // 2: RETURNED, 3: BROKEN

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { property: 'note' },
    ),
  })
  readonly note?: string;
}

export class ReturnLoanSlipDto {
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.field_required',
    ),
  })
  @IsArray({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_array',
      { property: 'items' },
    ),
  })
  @ValidateNested({ each: true })
  @Type(() => ReturnDeviceItemDto)
  readonly items: ReturnDeviceItemDto[];
}

export class LoanSlipListRequestDto extends PaginationRequestDto {
  @IsOptional()
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
      { property: 'borrowerId' },
    ),
  })
  readonly borrowerId?: string;

  @IsOptional()
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
      { property: 'loanerId' },
    ),
  })
  readonly loanerId?: string;

  @IsOptional()
  readonly status?: number;
}

export class LoanSlipDetailResponseDto {
  id: string;
  equipmentLoanSlipId: string;
  deviceId: string;
  status: number; // 1: BORROWED, 2: RETURNED, 3: BROKEN
  returnDate?: Date;
  note?: string;
  returnSlipCode?: string; // Mã phiếu trả (nếu đã trả)
  device?: {
    id: string;
    deviceName: string;
    serial?: string;
    model?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class LoanSlipResponseDto {
  id: string;
  code?: string;
  equipmentBorrowerId: string;
  equipmentLoanerId: string;
  status: EEquipmentLoanSlipStatus; // 1: BORROWING, 2: CLOSED, 3: CANCELLED
  totalReturned?: number; // Tổng số thiết bị đã trả
  details?: LoanSlipDetailResponseDto[];
  borrower?: {
    id: string;
    user?: {
      id: string;
      fullName: string;
      email: string;
    };
  };
  loaner?: {
    id: string;
    user?: {
      id: string;
      fullName: string;
      email: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export class LoanSlipListResponseDto extends PaginationResponseDto<LoanSlipResponseDto> {
  declare data: LoanSlipResponseDto[];
}
