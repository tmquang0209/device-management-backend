import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from 'src/generated/i18n.generated';
import { PaginationRequestDto, PaginationResponseDto } from './pagination.dto';

// ============== Rack DTOs ==============

export class CreateRackDto {
  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { field: 'code' },
    ),
  })
  readonly code?: string;

  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.field_required',
    ),
  })
  @IsNumber()
  readonly rows: number;

  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.field_required',
    ),
  })
  @IsNumber()
  readonly cols: number;

  @IsOptional()
  @IsNumber()
  readonly status?: number;
}

export class UpdateRackDto {
  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { field: 'code' },
    ),
  })
  readonly code?: string;

  @IsOptional()
  @IsNumber()
  readonly rows?: number;

  @IsOptional()
  @IsNumber()
  readonly cols?: number;

  @IsOptional()
  @IsNumber()
  readonly status?: number;
}

export class RackListRequestDto extends PaginationRequestDto {
  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { field: 'code' },
    ),
  })
  readonly code?: string;

  @IsOptional()
  @IsNumber()
  readonly status?: number;
}

export class RackResponseDto {
  readonly id: string;
  readonly code: string;
  readonly rows: number;
  readonly cols: number;
  readonly status: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdById?: string;
  readonly modifiedById?: string;
}

export class RackListResponseDto extends PaginationResponseDto<RackResponseDto> {
  declare readonly data: RackResponseDto[];
}
