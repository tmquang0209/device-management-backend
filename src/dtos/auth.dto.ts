import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import dayjs from 'dayjs';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from 'src/generated/i18n.generated';

export class LoginDto {
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
  readonly password: string;
}

export class RegisterDto {
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
  readonly fullName: string;

  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.field_required',
    ),
  })
  @IsEmail(
    {},
    {
      message: i18nValidationMessage<I18nTranslations>(
        'common.validation.must_be_email',
      ),
    },
  )
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
  @IsString()
  readonly phoneNumber?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? dayjs(value as Date) : value))
  readonly birthday?: Date;

  @IsOptional()
  @IsString()
  readonly address?: string;

  @IsOptional()
  @IsString()
  readonly roleId?: string;
}

export class ForgotPasswordDto {
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.field_required',
    ),
  })
  @IsEmail(
    {},
    {
      message: i18nValidationMessage<I18nTranslations>(
        'common.validation.must_be_email',
      ),
    },
  )
  readonly email: string;
}

export class BasicInfoDto {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly fullName: string;
  readonly email: string;
  readonly phoneNumber: string;
  readonly birthday?: Date;
  readonly status: boolean;
  readonly address?: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
  readonly roleId?: string;
  readonly id: string;
  readonly role?: {
    id: string;
    name: string;
    code: string;
    permissions: {
      id: string;
      key: string;
      endpoint: string;
    }[];
  };
}

export class RefreshTokenResponseDto {
  accessToken: string;
}
