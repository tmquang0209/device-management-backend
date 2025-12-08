import { PaginationRequestDto, PaginationResponseDto } from '@dto';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from 'src/generated/i18n.generated';

// ============== Partner DTOs ==============

export class CreatePartnerDto {
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.field_required',
    ),
  })
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { property: 'partnerName' },
    ),
  })
  readonly partnerName: string;

  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.field_required',
    ),
  })
  @IsNumber()
  readonly partnerType: number;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { property: 'description' },
    ),
  })
  readonly description?: string;

  @IsOptional()
  @IsNumber()
  readonly status?: number;
}

export class UpdatePartnerDto {
  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { property: 'partnerName' },
    ),
  })
  readonly partnerName?: string;

  @IsOptional()
  @IsNumber()
  readonly partnerType?: number;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { property: 'description' },
    ),
  })
  readonly description?: string;

  @IsOptional()
  @IsNumber()
  readonly status?: number;
}

export class PartnerListRequestDto extends PaginationRequestDto {
  @IsOptional()
  @IsString()
  readonly partnerName?: string;

  @IsOptional()
  @IsNumber()
  readonly partnerType?: number;

  @IsOptional()
  @IsNumber()
  readonly status?: number;
}

export class PartnerResponseDto {
  id: string;
  partnerName: string;
  partnerType: number;
  description?: string;
  status: number;
  createdAt: Date;
  updatedAt: Date;
}

export class PartnerListResponseDto extends PaginationResponseDto<PartnerResponseDto> {}
