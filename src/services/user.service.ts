import { buildSequelizeQuery } from '@common/utils/query-builder';
import {
  BasicInfoDto,
  ChangePasswordDto,
  CreateUserDto,
  UpdateUserDto,
  UserListRequestDto,
  UserListResponseDto,
} from '@dto';
import { PermissionEntity, RoleEntity, UserEntity } from '@entities';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AuditContextService, CacheService, RoleService } from '@services';
import * as bcrypt from 'bcryptjs';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(UserEntity)
    private readonly userRepo: typeof UserEntity,
    private readonly roleService: RoleService,
    private readonly i18n: I18nService,
    private readonly cacheService: CacheService,
    private readonly auditContext: AuditContextService,
  ) {}

  async createUser(params: CreateUserDto) {
    const existingUser = await this.userRepo.findOne({
      where: { email: params.email },
    });

    if (existingUser) {
      throw new ConflictException(this.i18n.t('user.create.email_exists'));
    }

    // check roleId
    const role = await this.roleService.findById(params.roleId);
    if (!role) {
      throw new BadRequestException(this.i18n.t('user.create.role_not_found'));
    }

    // create user step
    const newUser = await this.userRepo.create(params as UserEntity);
    return newUser;
  }

  async updateUser(
    params: UpdateUserDto,
  ): Promise<Omit<BasicInfoDto, 'accessToken' | 'refreshToken'>> {
    const user = await this.userRepo.findByPk(params.id, {
      attributes: {
        exclude: ['password', 'refreshToken', 'deletedAt'],
      },
      include: [
        {
          model: RoleEntity,
          required: true,
          attributes: ['id', 'code', 'name'],
          include: [
            {
              model: PermissionEntity,
              required: false,
              attributes: ['id', 'key', 'endpoint'],
              through: { attributes: [] },
            },
          ],
        },
      ],
    });

    if (!user) {
      throw new NotFoundException(this.i18n.t('user.update.user_not_found'));
    }
    this.auditContext.setAuditBefore(user);

    // Validate roleId if provided
    if (params.roleId && params.roleId !== user.role.id) {
      const role = await this.roleService.findById(params.roleId);
      if (!role) {
        throw new BadRequestException(
          this.i18n.t('user.update.role_not_found'),
        );
      }
    }

    // Update user
    await user.update(params);

    // clear cache
    await this.cacheService.delByPattern('*users*');

    this.auditContext.setAuditAfter(user);

    return user;
  }

  async getListUsers(params: UserListRequestDto): Promise<UserListResponseDto> {
    const { page, pageSize, sortBy, orderBy, ...filters } = params;
    const options = buildSequelizeQuery<UserEntity>(
      {
        page,
        pageSize,
        sortBy,
        sortOrder: orderBy,
        filters,
        include: [
          {
            model: RoleEntity,
            required: false,
            attributes: ['id', 'code', 'name'],
            include: [
              {
                model: PermissionEntity,
                required: false,
                attributes: ['id', 'key', 'endpoint'],
                through: { attributes: [] },
              },
            ],
          },
        ],
        exclude: ['password', 'refreshToken', 'roleId', 'deletedAt'],
        distinct: true,
      },
      UserEntity,
    );
    const { rows, count } = await this.userRepo.findAndCountAll(options);

    return {
      data: rows,
      total: count,
      page: options.offset! / options.limit! + 1,
      pageSize: options.limit!,
    };
  }

  async getUserById(
    id: string,
  ): Promise<Omit<BasicInfoDto, 'accessToken' | 'refreshToken'>> {
    const user = await this.userRepo.findOne({
      where: { id },
      attributes: {
        exclude: ['password', 'refreshToken', 'deletedAt'],
      },
      include: [
        {
          model: RoleEntity,
          required: true,
          attributes: ['id', 'code', 'name'],
          include: [
            {
              model: PermissionEntity,
              required: false,
              attributes: ['id', 'key', 'endpoint'],
            },
          ],
        },
      ],
    });

    if (!user) {
      throw new NotFoundException(this.i18n.t('user.details.not_found'));
    }

    return user;
  }

  getUserByEmail(email: string) {
    return this.userRepo.findOne({ where: { email } });
  }

  async changePassword(params: ChangePasswordDto, userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });
    if (!user)
      throw new BadRequestException(
        this.i18n.t('user.change_password.user_not_found'),
      );
    const isMatch = await bcrypt.compare(params.oldPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException(
        this.i18n.t('user.change_password.incorrect_password'),
      );
    }
    await this.userRepo.update(
      {
        password: await bcrypt.hash(params.newPassword, 10),
      },
      {
        where: { id: userId },
      },
    );
  }

  async lockUser(id: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user)
      throw new NotFoundException(this.i18n.t('user.change_status.not_found'));
    try {
      // audit before state
      this.auditContext.setAuditBefore(user);

      const updated = await user.update({ status: !user.status });
      if (!updated) {
        throw new BadRequestException(this.i18n.t('user.change_status.fail'));
      }

      await this.cacheService.delByPattern('*users*');

      this.auditContext.setAuditAfter(user);

      return;
    } catch {
      throw new BadRequestException(this.i18n.t('user.change_status.fail'));
    }
  }
}
