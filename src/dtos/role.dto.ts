import { Transform } from 'class-transformer';
import { IsBoolean, IsDate, IsOptional, IsString } from 'class-validator';
import * as dayjs from 'dayjs';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from 'src/generated/i18n.generated';
import { PaginationRequestDto, PaginationResponseDto } from './pagination.dto';

export class RoleInfoDto {
  id: string;
  code: string;
  name: string;
  description: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  permissions: {
    id: string;
    key: string;
    endpoint: string;
  }[];
}

export class CreateRoleDto {
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  readonly code: string;

  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  readonly name: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  readonly description: string;

  @IsOptional()
  @IsBoolean({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_boolean',
    ),
  })
  readonly isDefault: boolean;

  @IsOptional()
  @IsString({
    each: true,
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_array',
    ),
  })
  readonly permissions: string[];
}

export class UpdateRoleDto {
  @IsString()
  readonly id: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  readonly code?: string;

  @IsString()
  readonly name: string;

  @IsOptional()
  @IsString()
  readonly description: string;

  @IsBoolean()
  readonly isDefault: boolean;

  @IsString({ each: true })
  readonly permissions: string[];
}

export class RoleListRequestDto extends PaginationRequestDto {
  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  readonly code: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  readonly name: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  readonly description: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : undefined,
  )
  @IsBoolean({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_boolean',
    ),
  })
  readonly isDefault: boolean;

  @IsOptional()
  @Transform(({ value }) => dayjs(value as string).toDate())
  @IsDate({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_date',
    ),
  })
  readonly createdAt: Date;

  @IsOptional()
  @Transform(({ value }) => dayjs(value as string).toDate())
  @IsDate({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_date',
    ),
  })
  readonly updatedAt: Date;
}

export class RoleListResponseDto extends PaginationResponseDto<RoleInfoDto> {}
