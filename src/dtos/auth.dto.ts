import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
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
  readonly id: string;
  readonly name: string;
  readonly userName: string;
  readonly email?: string;
  readonly roleType: string;
  readonly status: boolean;
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
