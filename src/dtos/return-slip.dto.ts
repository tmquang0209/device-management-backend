import { EEquipmentReturnSlipStatus } from '@common/enums';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from 'src/generated/i18n.generated';
import { PaginationRequestDto, PaginationResponseDto } from './pagination.dto';

// ============== Return Slip Detail DTOs ==============

export class ReturnSlipDeviceItemDto {
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

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { property: 'note' },
    ),
  })
  readonly note?: string;
}

// ============== Create Return Slip DTOs ==============

export class CreateReturnSlipDto {
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.field_required',
    ),
  })
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
      { property: 'loanSlipId' },
    ),
  })
  readonly loanSlipId: string;

  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.field_required',
    ),
  })
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
      { property: 'returnerId' },
    ),
  })
  readonly returnerId: string;

  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.field_required',
    ),
  })
  @IsDateString(
    {},
    {
      message: i18nValidationMessage<I18nTranslations>(
        'common.validation.must_be_date',
        { property: 'returnDate' },
      ),
    },
  )
  readonly returnDate: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { property: 'note' },
    ),
  })
  readonly note?: string;

  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.field_required',
    ),
  })
  @IsArray({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_array',
      { property: 'devices' },
    ),
  })
  @ValidateNested({ each: true })
  @Type(() => ReturnSlipDeviceItemDto)
  readonly devices: ReturnSlipDeviceItemDto[];
}

// ============== Update Return Slip DTOs ==============

export class UpdateReturnSlipDto {
  @IsOptional()
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
      { property: 'returnerId' },
    ),
  })
  readonly returnerId?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { property: 'note' },
    ),
  })
  readonly note?: string;
}

// ============== List Return Slip DTOs ==============

export class ReturnSlipListRequestDto extends PaginationRequestDto {
  @IsOptional()
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
      { property: 'loanSlipId' },
    ),
  })
  readonly loanSlipId?: string;

  @IsOptional()
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
      { property: 'returnerId' },
    ),
  })
  readonly returnerId?: string;

  @IsOptional()
  readonly status?: number;
}

// ============== Response DTOs ==============

export class ReturnSlipDetailResponseDto {
  id: string;
  equipmentReturnSlipId: string;
  deviceId: string;
  note?: string;
  device?: {
    id: string;
    deviceName: string;
    serial?: string;
    model?: string;
    deviceType?: {
      id: string;
      name: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export class ReturnSlipResponseDto {
  id: string;
  code: string;
  equipmentLoanSlipId: string;
  returnerId: string;
  returnDate: Date;
  status: EEquipmentReturnSlipStatus;
  note?: string;
  details?: ReturnSlipDetailResponseDto[];
  loanSlip?: {
    id: string;
    code: string;
    status: number;
  };
  returner?: {
    id: string;
    user?: {
      id: string;
      name: string;
      email: string;
    };
  };
  createdByUser?: {
    id: string;
    name: string;
    email: string;
  };
  modifiedByUser?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class ReturnSlipListResponseDto extends PaginationResponseDto<ReturnSlipResponseDto> {
  declare data: ReturnSlipResponseDto[];
}

// ============== Get Available Devices for Return ==============

export class AvailableDeviceForReturnDto {
  id: string;
  deviceId: string;
  device: {
    id: string;
    deviceName: string;
    serial?: string;
    model?: string;
    deviceType?: {
      id: string;
      name: string;
    };
  };
  status: number; // 1: BORROWED - available for return
}
