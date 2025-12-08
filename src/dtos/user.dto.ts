import {
  BasicInfoDto,
  PaginationRequestDto,
  PaginationResponseDto,
} from '@dto';
import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from 'src/generated/i18n.generated';

export class CreateUserDto {
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.field_required',
    ),
  })
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
      { field: 'name' },
    ),
  })
  readonly name: string;

  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.field_required',
    ),
  })
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  readonly email: string;

  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.field_required',
    ),
  })
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  readonly password: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  readonly userName: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  readonly name: string;

  @IsOptional()
  @IsEmail(
    {},
    {
      message: i18nValidationMessage<I18nTranslations>(
        'common.validation.must_be_email',
      ),
    },
  )
  readonly email: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  readonly userName: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  readonly roleType: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.field_required',
    ),
  })
  readonly id: string;

  @IsOptional()
  @Transform(
    ({ value }: TransformFnParams) =>
      value === 'true' || value === true || value === 1 || value === '1',
  )
  @IsBoolean({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_boolean',
    ),
  })
  readonly status: boolean;
}

export class ChangePasswordDto {
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'auth.change_password.old_password_empty',
    ),
  })
  oldPassword: string;

  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'auth.change_password.new_password_empty',
    ),
  })
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message: i18nValidationMessage<I18nTranslations>(
        'auth.change_password.password_match',
      ),
    },
  )
  @Transform(({ value }: TransformFnParams) => value?.trim())
  newPassword: string;
}

export class UserListRequestDto extends PaginationRequestDto {
  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  readonly name: string;

  @IsOptional()
  @IsEmail(
    {},
    {
      message: i18nValidationMessage<I18nTranslations>(
        'common.validation.must_be_email',
      ),
    },
  )
  readonly email: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  readonly userName: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  readonly roleType: string;

  @IsOptional()
  @Transform(
    ({ value }: TransformFnParams) =>
      value === 'true' || value === true || value === 1 || value === '1',
  )
  @IsBoolean({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_boolean',
    ),
  })
  readonly status: boolean;
}

export class UserListResponseDto extends PaginationResponseDto<
  Omit<BasicInfoDto, 'refreshToken' | 'accessToken'>
> {}
