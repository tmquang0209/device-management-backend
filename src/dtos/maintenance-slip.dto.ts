import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from 'src/generated/i18n.generated';
import { PaginationRequestDto, PaginationResponseDto } from './pagination.dto';

// ============== Maintenance Slip DTOs ==============

export class CreateMaintenanceSlipDto {
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.field_required',
    ),
  })
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
      { field: 'deviceId' },
    ),
  })
  readonly deviceId: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { field: 'transferStatus' },
    ),
  })
  readonly transferStatus?: string;

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
  readonly status?: number;
}

export class UpdateMaintenanceSlipDto {
  @IsOptional()
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
      { field: 'deviceId' },
    ),
  })
  readonly deviceId?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { field: 'transferStatus' },
    ),
  })
  readonly transferStatus?: string;

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
  readonly status?: number;
}

export class MaintenanceSlipListRequestDto extends PaginationRequestDto {
  @IsOptional()
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
      { field: 'deviceId' },
    ),
  })
  readonly deviceId?: string;

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
      { field: 'transferStatus' },
    ),
  })
  readonly transferStatus?: string;

  @IsOptional()
  @IsNumber()
  readonly status?: number;
}

export class MaintenanceSlipResponseDto {
  readonly id: string;
  readonly deviceId: string;
  readonly transferStatus?: string;
  readonly partnerId?: string;
  readonly reason?: string;
  readonly requestDate?: Date;
  readonly status: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdById?: string;
  readonly modifiedById?: string;
}

export class MaintenanceSlipListResponseDto extends PaginationResponseDto<MaintenanceSlipResponseDto> {
  declare readonly data: MaintenanceSlipResponseDto[];
}
