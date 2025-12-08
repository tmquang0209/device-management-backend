import { generatePassword } from '@common/utils';
import { BasicInfoDto, ForgotPasswordDto, LoginDto, RegisterDto } from '@dto';
import { RoleEntity, UserEntity } from '@entities';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MailProducer } from '@producers';
import * as bcrypt from 'bcryptjs';
import { I18nService } from 'nestjs-i18n';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(UserEntity)
    private readonly userRepo: typeof UserEntity,
    private readonly tokenService: TokenService,
    private readonly i18n: I18nService,
    private readonly mailProducer: MailProducer,
  ) {}

  async register(params: RegisterDto): Promise<void> {
    const userExist = await this.userRepo.findOne({
      where: { email: params.email },
    });
    if (userExist)
      throw new BadRequestException(this.i18n.t('auth.register.user_exists'));

    // find default role
    const defaultRole = await RoleEntity.findOne({
      where: { isDefault: true },
    });
    if (!defaultRole)
      throw new BadRequestException(
        this.i18n.t('auth.register.role_not_found'),
      );

    const hashedPassword = await bcrypt.hash(params.password, 10);
    await this.userRepo.create({
      name: params.fullName,
      email: params.email,
      password: hashedPassword,
      userName: params.email.split('@')[0],
    } as UserEntity);

    await this.mailProducer.sendMailJob({
      to: params.email,
      subject: 'Welcome to Our App!',
      data: { name: params.fullName },
      template: 'welcome',
    });
  }

  async login(params: LoginDto): Promise<BasicInfoDto> {
    const userExist = await this.userRepo.findOne({
      where: { email: params.email, status: true },
      attributes: {
        exclude: ['password', 'updatedAt', 'createdAt'],
      },
    });
    if (!userExist)
      throw new BadRequestException(this.i18n.t('auth.login.user_not_found'));

    const isMatch = await bcrypt.compare(params.password, userExist.password);
    if (!isMatch) {
      throw new BadRequestException(this.i18n.t('auth.password.incorrect'));
    }
    const { accessToken, refreshToken: refreshTokenNew } =
      await this.generateJwt(userExist);

    return {
      accessToken,
      refreshToken: refreshTokenNew,
      id: userExist.id,
      email: userExist.email || '',
      name: userExist.name,
      userName: userExist.userName,
      roleType: userExist.roleType,
      status: userExist.status,
    } as unknown as BasicInfoDto;
  }

  async generateJwt(user: UserEntity) {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.generateAccessToken(user),
      this.tokenService.generateRefreshToken(user),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<BasicInfoDto> {
    const user = await this.userRepo.findOne({
      where: {
        id: userId,
      },
      attributes: {
        exclude: ['password'],
      },
    });

    if (!user)
      throw new BadRequestException(this.i18n.t('auth.login.user_not_found'));

    const accessToken = await this.tokenService.generateAccessToken(user);

    return {
      id: user.id,
      email: user.email || '',
      name: user.name,
      userName: user.userName,
      roleType: user.roleType,
      status: user.status,
      accessToken,
      refreshToken,
    } as unknown as BasicInfoDto;
  }

  async sendNewPassword(params: ForgotPasswordDto): Promise<void> {
    const user = await this.userRepo.findOne({
      where: {
        email: params.email,
      },
    });
    if (!user)
      throw new BadRequestException(this.i18n.t('auth.login.user_not_found'));
    const newPassword = generatePassword(8);

    await user.update({
      password: newPassword,
    });

    await this.mailProducer.sendMailJob({
      to: user.email || '',
      subject: 'Reset password successfully',
      data: { name: user.name, newPassword },
      template: 'reset-password',
    });
  }
}
