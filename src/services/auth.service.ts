import { EAuthLoginType } from '@common/enums';
import { generatePassword } from '@common/utils';
import { BasicInfoDto, ForgotPasswordDto, LoginDto, RegisterDto } from '@dto';
import { PermissionEntity, RoleEntity, UserEntity } from '@entities';
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

    await this.userRepo.create({
      fullName: params.fullName,
      email: params.email,
      password: params.password,
      roleId: defaultRole.id,
      phoneNumber: params.phoneNumber,
      birthday: params.birthday,
      address: params.address,
    } as UserEntity);

    await this.mailProducer.sendMailJob({
      to: params.email,
      subject: 'Welcome to Our App!',
      data: { name: params.fullName },
      template: 'welcome',
    });
  }

  async login(
    params: LoginDto,
    loginType: EAuthLoginType = EAuthLoginType.CLIENT,
  ): Promise<BasicInfoDto> {
    const userExist = await this.userRepo.findOne({
      where: { email: params.email, status: true },
      attributes: {
        exclude: ['refreshToken', 'updatedAt', 'createdAt', 'roleId'],
      },
      include: [
        {
          model: RoleEntity,
          attributes: ['id', 'name', 'code'],
          where: {
            ...(loginType === EAuthLoginType.SYSTEM
              ? { code: 'system_admin' }
              : {}),
          },
          include: [
            {
              model: PermissionEntity,
              attributes: ['id', 'key', 'endpoint'],
              through: { attributes: [] },
            },
          ],
        },
      ],
    });
    if (!userExist)
      throw new BadRequestException(this.i18n.t('auth.login.user_not_found'));

    const isMatch = await bcrypt.compare(params.password, userExist.password);
    if (!isMatch) {
      throw new BadRequestException(this.i18n.t('auth.password.incorrect'));
    }
    const { accessToken, refreshToken: refreshTokenNew } =
      await this.generateJwt(userExist);

    // save refresh token
    await this.userRepo.update(
      {
        refreshToken: refreshTokenNew,
      },
      {
        where: {
          id: userExist.id,
        },
      },
    );

    return {
      accessToken,
      refreshToken: refreshTokenNew,
      id: userExist.id,
      email: userExist.email,
      fullName: userExist.fullName,
      phoneNumber: userExist.phoneNumber,
      status: userExist.status,
      role: userExist.role,
    };
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
        refreshToken,
      },
      attributes: {
        exclude: ['updatedAt', 'createdAt', 'password'],
      },
      include: [
        {
          model: RoleEntity,
          attributes: ['id', 'name', 'code'],
          include: [
            {
              model: PermissionEntity,
              attributes: ['id', 'key', 'endpoint'],
              through: { attributes: [] },
            },
          ],
        },
      ],
    });

    if (!user)
      throw new BadRequestException(this.i18n.t('auth.login.user_not_found'));

    const accessToken = await this.tokenService.generateAccessToken(user);

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      status: user.status,
      role: user.role,
      accessToken,
      refreshToken,
    };
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
      to: user.email,
      subject: 'Reset password successfully',
      data: { name: user.fullName, newPassword },
      template: 'reset-password',
    });
  }
}
