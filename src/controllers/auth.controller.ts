import { EndpointKey, ResponseMessage } from '@common/decorators';
import { AllowUnauthorized } from '@common/decorators/allow-unauthorized.decorator';
import { RefreshTokenGuard } from '@common/guards';
import { ForgotPasswordDto, LoginDto, RegisterDto } from '@dto';
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from '@services';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from 'src/generated/i18n.generated';

@AllowUnauthorized()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @EndpointKey('auth.login')
  @Post('login')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('auth.login.success'),
  )
  login(@Body() params: LoginDto) {
    return this.authService.login(params);
  }

  @EndpointKey('auth.register')
  @Post('register')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('auth.register.success'),
  )
  async register(@Body() params: RegisterDto) {
    return this.authService.register(params);
  }

  @EndpointKey('auth.refresh')
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('auth.refresh_token.success'),
  )
  refresh(@Req() req: Request) {
    const { sub, refreshToken } = req['user'];
    return this.authService.refreshToken(sub as string, refreshToken as string);
  }

  @EndpointKey('auth.forgot_password')
  @Post('forgot-password')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('auth.forgot_password.success'),
  )
  async forgotPassword(@Body() params: ForgotPasswordDto) {
    return this.authService.sendNewPassword(params);
  }
}
