import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from 'src/generated/i18n.generated';
import { PaginationRequestDto, PaginationResponseDto } from './pagination.dto';

export class CreateDeviceTypeDto {
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.field_required',
    ),
  })
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { field: 'deviceTypeName' },
    ),
  })
  readonly deviceTypeName: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { field: 'description' },
    ),
  })
  readonly description?: string;

  @IsOptional()
  readonly status?: number;
}

export class UpdateDeviceTypeDto {
  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { field: 'deviceTypeName' },
    ),
  })
  readonly deviceTypeName?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { field: 'description' },
    ),
  })
  readonly description?: string;

  @IsOptional()
  readonly status?: number;
}

export class DeviceTypeListRequestDto extends PaginationRequestDto {
  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { field: 'deviceTypeName' },
    ),
  })
  readonly deviceTypeName?: string;

  @IsOptional()
  readonly status?: number;
}

export class DeviceTypeResponseDto {
  readonly id: string;
  readonly deviceTypeName: string;
  readonly description?: string;
  readonly status: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class DeviceTypeListResponseDto extends PaginationResponseDto<DeviceTypeResponseDto> {
  declare readonly data: DeviceTypeResponseDto[];
}

// ==================== Device Location DTOs ====================

export class CreateDeviceLocationDto {
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.field_required',
    ),
  })
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
      { field: 'rackId' },
    ),
  })
  readonly rackId: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { field: 'xPosition' },
    ),
  })
  readonly xPosition?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { field: 'yPosition' },
    ),
  })
  readonly yPosition?: string;

  @IsOptional()
  readonly status?: number;
}

export class UpdateDeviceLocationDto {
  @IsOptional()
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
      { field: 'rackId' },
    ),
  })
  readonly rackId?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { field: 'xPosition' },
    ),
  })
  readonly xPosition?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { field: 'yPosition' },
    ),
  })
  readonly yPosition?: string;

  @IsOptional()
  readonly status?: number;
}

export class DeviceLocationListRequestDto extends PaginationRequestDto {
  @IsOptional()
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
      { field: 'rackId' },
    ),
  })
  readonly rackId?: string;

  @IsOptional()
  readonly xPosition?: string;

  @IsOptional()
  readonly yPosition?: string;

  @IsOptional()
  readonly status?: number;
}

export class DeviceLocationResponseDto {
  readonly id: string;
  readonly rackId: string;
  readonly xPosition?: string;
  readonly yPosition?: string;
  readonly status: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly rack?: {
    id: string;
    code: string;
  };
}

export class DeviceLocationListResponseDto extends PaginationResponseDto<DeviceLocationResponseDto> {
  declare readonly data: DeviceLocationResponseDto[];
}

// ==================== Device DTOs ====================

export class CreateDeviceDto {
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.field_required',
    ),
  })
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { field: 'deviceName' },
    ),
  })
  readonly deviceName: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { field: 'serial' },
    ),
  })
  readonly serial?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { field: 'model' },
    ),
  })
  readonly model?: string;

  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.field_required',
    ),
  })
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
    ),
  })
  readonly deviceTypeId: string;

  @IsOptional()
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
      { field: 'deviceLocationId' },
    ),
  })
  readonly deviceLocationId?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { field: 'supplier' },
    ),
  })
  readonly supplier?: string;

  @IsOptional()
  readonly status?: number;

  @IsOptional()
  @IsDate({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_date',
      { field: 'purchaseDate' },
    ),
  })
  @Transform(({ value }: TransformFnParams) =>
    value ? new Date(value as string | number | Date) : undefined,
  )
  readonly purchaseDate?: Date;

  @IsOptional()
  @IsDate({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_date',
      { field: 'warrantyExpirationDate' },
    ),
  })
  @Transform(({ value }: TransformFnParams) =>
    value ? new Date(value as string | number | Date) : undefined,
  )
  readonly warrantyExpirationDate?: Date;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { field: 'notes' },
    ),
  })
  readonly notes?: string;
}

export class UpdateDeviceDto {
  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { field: 'deviceName' },
    ),
  })
  readonly deviceName?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { field: 'serial' },
    ),
  })
  readonly serial?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { field: 'model' },
    ),
  })
  readonly model?: string;

  @IsOptional()
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
    ),
  })
  readonly deviceTypeId?: string;

  @IsOptional()
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
      { field: 'deviceLocationId' },
    ),
  })
  readonly deviceLocationId?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { field: 'supplier' },
    ),
  })
  readonly supplier?: string;

  @IsOptional()
  readonly status?: number;

  @IsOptional()
  @IsDate({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_date',
      { field: 'purchaseDate' },
    ),
  })
  @Transform(({ value }: TransformFnParams) =>
    value ? new Date(value as string | number | Date) : undefined,
  )
  readonly purchaseDate?: Date;

  @IsOptional()
  @IsDate({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_date',
      { field: 'warrantyExpirationDate' },
    ),
  })
  @Transform(({ value }: TransformFnParams) =>
    value ? new Date(value as string | number | Date) : undefined,
  )
  readonly warrantyExpirationDate?: Date;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { field: 'notes' },
    ),
  })
  readonly notes?: string;
}

export class ChangeDeviceStatusDto {
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.field_required',
    ),
  })
  readonly status: number;
}

export class DeviceListRequestDto extends PaginationRequestDto {
  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { field: 'deviceName' },
    ),
  })
  readonly deviceName?: string;

  @IsOptional()
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
    ),
  })
  readonly deviceTypeId?: string;

  @IsOptional()
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
    ),
  })
  readonly deviceLocationId?: string;

  @IsOptional()
  readonly status?: number;

  @IsOptional()
  readonly supplier?: string;

  @IsOptional()
  @Transform(({ value }) => {
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  })
  readonly purchaseDate?: Date;

  @IsOptional()
  @Transform(({ value }) => {
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  })
  readonly warrantyExpirationDate?: Date;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { field: 'serial' },
    ),
  })
  readonly serial?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { field: 'model' },
    ),
  })
  readonly model?: string;
}

export class DeviceTypeInfoDto {
  readonly id: string;
  readonly deviceTypeName: string;
  readonly description?: string;
}

export class DeviceLocationInfoDto {
  readonly id: string;
  readonly deviceLocationName: string;
  readonly location?: string;
}

export class SupplierInfoDto {
  readonly id: string;
  readonly supplierName: string;
  readonly contactInfo?: string;
}

export class WarrantyInfoDto {
  readonly id: string;
  readonly warrantyName: string;
  readonly startDate?: Date;
  readonly endDate?: Date;
}

export class RackInfoDto {
  readonly id: string;
  readonly code: string;
  readonly status: number;
  readonly deviceLocations?: {
    id: string;
    xPosition?: string;
    yPosition?: string;
    status: number;
  }[];
}

export class DeviceResponseDto {
  readonly id: string;
  readonly deviceName: string;
  readonly serial?: string;
  readonly model?: string;
  readonly deviceType?: DeviceTypeInfoDto;
  readonly rack?: RackInfoDto;
  readonly supplier?: string;
  readonly status: number;
  readonly purchaseDate?: Date;
  readonly warrantyExpirationDate?: Date;
  readonly notes?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class DeviceListResponseDto extends PaginationResponseDto<DeviceResponseDto> {
  declare readonly data: DeviceResponseDto[];
}

export class DeviceDetailResponseDto {
  readonly id: string;
  readonly deviceName: string;
  readonly serial?: string;
  readonly model?: string;
  readonly deviceType?: DeviceTypeInfoDto;
  readonly rack?: RackInfoDto;
  readonly supplier?: string;
  readonly warranty?: WarrantyInfoDto[];
  readonly status: number;
  readonly purchaseDate?: Date;
  readonly warrantyExpirationDate?: Date;
  readonly notes?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class DevicesByTypeRequestDto extends PaginationRequestDto {}

export class DevicesByLocationRequestDto extends PaginationRequestDto {}

export class UnassignedDevicesRequestDto extends PaginationRequestDto {
  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { field: 'deviceName' },
    ),
  })
  readonly deviceName?: string;

  @IsOptional()
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
    ),
  })
  readonly deviceTypeId?: string;

  @IsOptional()
  readonly status?: number;
}

// DTO for getting available devices for loan
export class AvailableDevicesForLoanRequestDto {
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.field_required',
    ),
  })
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
      { field: 'deviceTypeId' },
    ),
  })
  readonly deviceTypeId: string;

  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.field_required',
    ),
  })
  @Transform(({ value }) => parseInt(value as string, 10))
  readonly quantity: number;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  readonly excludeDeviceIds?: string[];
}
