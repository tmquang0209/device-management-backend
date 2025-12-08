import { PaginationRequestDto, PaginationResponseDto } from '@dto';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from 'src/generated/i18n.generated';

// ============== Param DTOs ==============

export class CreateParamDto {
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.field_required',
    ),
  })
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { property: 'type' },
    ),
  })
  readonly type: string;

  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.field_required',
    ),
  })
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { property: 'code' },
    ),
  })
  readonly code: string;

  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.field_required',
    ),
  })
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { property: 'value' },
    ),
  })
  readonly value: string;

  @IsOptional()
  @IsNumber()
  readonly status?: number;
}

export class UpdateParamDto {
  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { property: 'type' },
    ),
  })
  readonly type?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { property: 'code' },
    ),
  })
  readonly code?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { property: 'value' },
    ),
  })
  readonly value?: string;

  @IsOptional()
  @IsNumber()
  readonly status?: number;
}

export class ParamListRequestDto extends PaginationRequestDto {
  @IsOptional()
  @IsString()
  readonly type?: string;

  @IsOptional()
  @IsString()
  readonly code?: string;

  @IsOptional()
  @IsNumber()
  readonly status?: number;
}

export class ParamResponseDto {
  id: string;
  type: string;
  code: string;
  value: string;
  status: number;
  createdAt: Date;
  updatedAt: Date;
}

export class ParamListResponseDto extends PaginationResponseDto<ParamResponseDto> {}
