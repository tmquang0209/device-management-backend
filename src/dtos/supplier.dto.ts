import { PaginationRequestDto, PaginationResponseDto } from '@dto';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from 'src/generated/i18n.generated';

// ============== Supplier DTOs ==============

export class CreateSupplierDto {
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.field_required',
    ),
  })
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { property: 'supplierName' },
    ),
  })
  readonly supplierName: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { property: 'address' },
    ),
  })
  readonly address?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { property: 'phone' },
    ),
  })
  readonly phone?: string;

  @IsOptional()
  @IsNumber()
  readonly status?: number;
}

export class UpdateSupplierDto {
  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { property: 'supplierName' },
    ),
  })
  readonly supplierName?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { property: 'address' },
    ),
  })
  readonly address?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { property: 'phone' },
    ),
  })
  readonly phone?: string;

  @IsOptional()
  @IsNumber()
  readonly status?: number;
}

export class SupplierListRequestDto extends PaginationRequestDto {
  @IsOptional()
  @IsString()
  readonly supplierName?: string;

  @IsOptional()
  @IsNumber()
  readonly status?: number;
}

export class SupplierResponseDto {
  id: string;
  supplierName: string;
  address?: string;
  phone?: string;
  status: number;
  createdAt: Date;
  updatedAt: Date;
}

export class SupplierListResponseDto extends PaginationResponseDto<SupplierResponseDto> {}
