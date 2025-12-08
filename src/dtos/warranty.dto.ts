import { EWarrantyStatus } from '@common/enums';
import { PaginationRequestDto, PaginationResponseDto } from '@dto';
import { Transform } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from 'src/generated/i18n.generated';

// ============== Warranty DTOs ==============

export class CreateWarrantyDto {
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
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { property: 'reason' },
    ),
  })
  readonly reason: string;

  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.field_required',
    ),
  })
  @IsDate({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_date',
      { property: 'requestDate' },
    ),
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return new Date(value);
    }
    return value;
  })
  readonly requestDate: Date;
}

export class UpdateWarrantyDto {
  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { property: 'reason' },
    ),
  })
  readonly reason?: string;

  @IsOptional()
  @IsDate({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_date',
      { property: 'requestDate' },
    ),
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return new Date(value);
    }
    return value;
  })
  readonly requestDate?: Date;

  @IsOptional()
  readonly status?: number;
}

export class WarrantyListRequestDto extends PaginationRequestDto {
  @IsOptional()
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
      { property: 'deviceId' },
    ),
  })
  readonly deviceId?: string;

  @IsOptional()
  readonly status?: number;
}

export class WarrantyResponseDto {
  id: string;
  deviceId: string;
  reason?: string;
  requestDate?: Date;
  status: EWarrantyStatus; // 1: PENDING, 2: PROCESSING, 3: COMPLETED, 4: REJECTED
  device?: {
    id: string;
    deviceName: string;
    serial?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class WarrantyListResponseDto extends PaginationResponseDto<WarrantyResponseDto> {
  declare data: WarrantyResponseDto[];
}
