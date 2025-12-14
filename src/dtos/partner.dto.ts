import { PaginationRequestDto, PaginationResponseDto } from '@dto';
import { Transform } from 'class-transformer';
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
      'common.validation.must_be_uuid',
      { property: 'userId' },
    ),
  })
  readonly userId: string;

  @Transform(({ value }) => Number.parseInt(value, 10))
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.field_required',
    ),
  })
  @IsNumber()
  readonly partnerType: number;

  @IsOptional()
  @IsNumber()
  readonly status?: number;
}

export class UpdatePartnerDto {
  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
      { property: 'userId' },
    ),
  })
  readonly userId?: string;

  @Transform(({ value }) => {
    Number.parseInt(value, 10);
  })
  @IsOptional()
  @IsNumber()
  readonly partnerType?: number;

  @IsOptional()
  @IsNumber()
  readonly status?: number;
}

export class PartnerListRequestDto extends PaginationRequestDto {
  @IsOptional()
  @IsString()
  readonly userId?: string;

  @IsOptional()
  @Transform(({ value }) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  })
  @IsNumber()
  readonly partnerType?: number;

  @IsOptional()
  @IsNumber()
  readonly status?: number;

  @IsOptional()
  @IsString()
  readonly 'user.name'?: string;
}

export class PartnerResponseDto {
  id: string;
  userId: string;
  partnerType: number;
  partnerTypeLabel?: string;
  status: number;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export class PartnerListResponseDto extends PaginationResponseDto<PartnerResponseDto> {}
