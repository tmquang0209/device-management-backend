import { EEquipmentLoanSlipStatus } from '@common/enums';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
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
  @IsDate({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_date',
      { property: 'expectedReturnDate' },
    ),
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return new Date(value);
    }
    return value;
  })
  readonly expectedReturnDate: Date;

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
  readonly status: number; // 2: RETURNED, 3: BROKEN

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
  equipmentBorrowerId: string;
  equipmentLoanerId: string;
  status: EEquipmentLoanSlipStatus; // 1: BORROWING, 2: CLOSED, 3: CANCELLED
  expectedReturnDate?: Date;
  details?: LoanSlipDetailResponseDto[];
  borrower?: {
    id: string;
    name: string;
    userName: string;
  };
  loaner?: {
    id: string;
    name: string;
    userName: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class LoanSlipListResponseDto extends PaginationResponseDto<LoanSlipResponseDto> {
  declare data: LoanSlipResponseDto[];
}
