import {
  EMaintenanceSlipDetailStatus,
  EMaintenanceSlipStatus,
} from '@common/enums';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
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

// ============== Maintenance Slip DTOs ==============

export class CreateDeviceItemMaintenanceDto {
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

export class CreateMaintenanceSlipDto {
  @IsOptional()
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
      { field: 'partnerId' },
    ),
  })
  readonly partnerId?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { field: 'reason' },
    ),
  })
  readonly reason?: string;

  @IsOptional()
  @Transform(({ value }: TransformFnParams) =>
    value ? new Date(value) : undefined,
  )
  @IsDate({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_date',
      { field: 'requestDate' },
    ),
  })
  readonly requestDate?: Date;

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
  @IsArray({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_array',
      { property: 'devices' },
    ),
  })
  @ValidateNested({ each: true })
  @Type(() => CreateDeviceItemMaintenanceDto)
  readonly devices?: CreateDeviceItemMaintenanceDto[];
}

export class ReturnDeviceItemMaintenanceDto {
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

export class ReturnMaintenanceSlipDto {
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
  @Type(() => ReturnDeviceItemMaintenanceDto)
  readonly items: ReturnDeviceItemMaintenanceDto[];
}

export class UpdateMaintenanceSlipDto {
  @IsOptional()
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
      { field: 'partnerId' },
    ),
  })
  readonly partnerId?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { field: 'reason' },
    ),
  })
  readonly reason?: string;

  @IsOptional()
  @Transform(({ value }: TransformFnParams) =>
    value ? new Date(value) : undefined,
  )
  @IsDate({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_date',
      { field: 'requestDate' },
    ),
  })
  readonly requestDate?: Date;

  @IsOptional()
  @IsNumber()
  readonly status?: EMaintenanceSlipStatus;
}

export class MaintenanceSlipListRequestDto extends PaginationRequestDto {
  @IsOptional()
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
      { field: 'partnerId' },
    ),
  })
  readonly partnerId?: string;

  @IsOptional()
  @IsNumber()
  readonly status?: EMaintenanceSlipStatus;
}

export class MaintenanceSlipDetailResponseDto {
  id: string;
  maintenanceSlipId: string;
  deviceId: string;
  status: number; // 1: SENT, 2: RETURNED, 3: BROKEN
  returnDate?: Date;
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

export class MaintenanceSlipResponseDto {
  readonly id: string;
  readonly code: string;
  readonly partnerId?: string;
  readonly reason?: string;
  readonly requestDate?: Date;
  readonly status: EMaintenanceSlipStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdById?: string;
  readonly modifiedById?: string;
  readonly partner?: {
    id: string;
    userId?: string;
    partnerType?: string;
    user?: {
      id: string;
      name: string;
      email: string;
    };
  };
  readonly details?: MaintenanceSlipDetailResponseDto[];
}

export class MaintenanceSlipListResponseDto extends PaginationResponseDto<MaintenanceSlipResponseDto> {
  declare readonly data: MaintenanceSlipResponseDto[];
}
