import {
  EMaintenanceReturnSlipStatus,
  EMaintenanceSlipDetailStatus,
} from '@common/enums';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from 'src/generated/i18n.generated';
import { PaginationRequestDto, PaginationResponseDto } from './pagination.dto';

// ============== Maintenance Return Slip Detail DTOs ==============

export class MaintenanceReturnSlipDeviceItemDto {
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
  @IsNumber(
    {},
    {
      message: i18nValidationMessage<I18nTranslations>(
        'common.validation.must_be_number',
        { property: 'status' },
      ),
    },
  )
  readonly status: EMaintenanceSlipDetailStatus; // 2: RETURNED, 3: BROKEN

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { property: 'note' },
    ),
  })
  readonly note?: string;
}

// ============== Create Maintenance Return Slip DTOs ==============

export class CreateMaintenanceReturnSlipDto {
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.field_required',
    ),
  })
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
      { property: 'maintenanceSlipId' },
    ),
  })
  readonly maintenanceSlipId: string;

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
  @Type(() => MaintenanceReturnSlipDeviceItemDto)
  readonly devices: MaintenanceReturnSlipDeviceItemDto[];
}

// ============== Update Maintenance Return Slip DTOs ==============

export class UpdateMaintenanceReturnSlipDto {
  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { property: 'note' },
    ),
  })
  readonly note?: string;
}

// ============== List Maintenance Return Slip DTOs ==============

export class MaintenanceReturnSlipListRequestDto extends PaginationRequestDto {
  @IsOptional()
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
      { property: 'maintenanceSlipId' },
    ),
  })
  readonly maintenanceSlipId?: string;

  @IsOptional()
  readonly status?: number;
}

// ============== Response DTOs ==============

export class MaintenanceReturnSlipDetailResponseDto {
  id: string;
  maintenanceReturnSlipId: string;
  deviceId: string;
  note?: string;
  device?: {
    id: string;
    deviceName: string;
    serial?: string;
    model?: string;
    deviceType?: {
      id: string;
      deviceTypeName: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export class MaintenanceReturnSlipResponseDto {
  id: string;
  code: string;
  maintenanceSlipId: string;
  status: EMaintenanceReturnSlipStatus;
  note?: string;
  details?: MaintenanceReturnSlipDetailResponseDto[];
  maintenanceSlip?: {
    id: string;
    code: string;
    status: number;
    partner?: {
      id: string;
      user?: {
        id: string;
        name: string;
        email: string;
      };
    };
  };
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  updater?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class MaintenanceReturnSlipListResponseDto extends PaginationResponseDto<MaintenanceReturnSlipResponseDto> {
  declare data: MaintenanceReturnSlipResponseDto[];
}

// ============== Get Available Devices for Return ==============

export class AvailableDeviceForMaintenanceReturnDto {
  id: string;
  deviceId: string;
  device: {
    id: string;
    deviceName: string;
    serial?: string;
    model?: string;
    deviceType?: {
      id: string;
      deviceTypeName: string;
    };
  };
  status: number; // 1: SENT - available for return
}
