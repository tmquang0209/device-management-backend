import { Transform, TransformFnParams } from 'class-transformer';
import {
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
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { field: 'deviceLocationName' },
    ),
  })
  readonly deviceLocationName: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { field: 'location' },
    ),
  })
  readonly location?: string;

  @IsOptional()
  readonly status?: number;
}

export class UpdateDeviceLocationDto {
  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { field: 'deviceLocationName' },
    ),
  })
  readonly deviceLocationName?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { field: 'location' },
    ),
  })
  readonly location?: string;

  @IsOptional()
  readonly status?: number;
}

export class DeviceLocationListRequestDto extends PaginationRequestDto {
  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { field: 'deviceLocationName' },
    ),
  })
  readonly deviceLocationName?: string;

  @IsOptional()
  readonly status?: number;
}

export class DeviceLocationResponseDto {
  readonly id: string;
  readonly deviceLocationName: string;
  readonly location?: string;
  readonly status: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
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
  readonly deviceLocationId: string;

  @IsOptional()
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
    ),
  })
  readonly supplierId?: string;

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
    ),
  })
  readonly deviceLocationId?: string;

  @IsOptional()
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
    ),
  })
  readonly supplierId?: string;

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

export class DeviceResponseDto {
  readonly id: string;
  readonly deviceName: string;
  readonly serial?: string;
  readonly model?: string;
  readonly deviceType?: DeviceTypeInfoDto;
  readonly deviceLocation?: DeviceLocationInfoDto;
  readonly supplier?: SupplierInfoDto;
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
  readonly deviceLocation?: DeviceLocationInfoDto;
  readonly supplier?: SupplierInfoDto;
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
