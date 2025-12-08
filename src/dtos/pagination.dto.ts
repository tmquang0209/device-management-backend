import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from 'src/generated/i18n.generated';

export class PaginationRequestDto {
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsNumber(
    {},
    {
      message: i18nValidationMessage<I18nTranslations>(
        'common.validation.must_be_number',
      ),
    },
  )
  readonly page: number = 1;

  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsNumber(
    {},
    {
      message: i18nValidationMessage<I18nTranslations>(
        'common.validation.must_be_number',
      ),
    },
  )
  readonly pageSize: number = 10;

  @IsOptional()
  @IsString()
  readonly sortBy: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.in_array',
      {
        property: 'order',
        values: ['ASC', 'DESC'].join(', '),
      },
    ),
  })
  readonly orderBy: 'ASC' | 'DESC';
}

export class PaginationResponseDto<T> {
  readonly data: T[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
}
