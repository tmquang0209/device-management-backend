import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { I18nService } from 'nestjs-i18n';

import { DEFAULT_PARTNER_TYPE, PARAM_TYPES } from '@common/constants';
import { buildSequelizeQuery } from '@common/utils/query-builder';
import {
  CreatePartnerDto,
  PartnerListRequestDto,
  PartnerListResponseDto,
  PartnerResponseDto,
  UpdatePartnerDto,
} from '@dto';
import { ParamEntity, PartnerEntity, UserEntity } from '@entities';
import { CacheService } from '@services';

@Injectable()
export class PartnerService implements OnModuleInit {
  private readonly logger = new Logger(PartnerService.name);

  constructor(
    @InjectModel(PartnerEntity)
    private readonly partnerRepo: typeof PartnerEntity,
    @InjectModel(UserEntity)
    private readonly userRepo: typeof UserEntity,
    @InjectModel(ParamEntity)
    private readonly paramRepo: typeof ParamEntity,
    private readonly i18n: I18nService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Initialize partner type in param table if not exists
   */
  async onModuleInit() {
    this.logger.log('Initializing partner type configurations...');
    await this.initPartnerType();
    this.logger.log('Partner type configurations initialized.');
  }

  /**
   * Initialize partner type in param table
   */
  private async initPartnerType() {
    for (const partnerType of DEFAULT_PARTNER_TYPE) {
      const existing = await this.paramRepo.findOne({
        where: {
          type: PARAM_TYPES.PARTNER_TYPE,
          code: partnerType.code,
        },
      });

      if (!existing) {
        await this.paramRepo.create({
          type: PARAM_TYPES.PARTNER_TYPE,
          code: partnerType.code,
          value: partnerType.value,
          status: partnerType.status,
        } as ParamEntity);
        this.logger.log(
          `Created partner type: ${partnerType.code} - ${partnerType.value}`,
        );
      }
    }
  }

  /**
   * Get partner type labels from param table
   */
  private async getPartnerTypeLabels(): Promise<Map<string, string>> {
    const partnerTypes = await this.paramRepo.findAll({
      where: {
        type: PARAM_TYPES.PARTNER_TYPE,
        status: 1,
      },
    });

    const labelMap = new Map<string, string>();
    for (const pt of partnerTypes) {
      labelMap.set(pt.code, pt.value);
    }
    return labelMap;
  }

  async create(
    dto: CreatePartnerDto,
    userId?: string,
  ): Promise<PartnerResponseDto> {
    // Check if email already exists
    const existingUser = await this.userRepo.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException(this.i18n.t('partner.create.email_exists'));
    }

    // Create user with HIDDEN role
    const newUser = await this.userRepo.create({
      userName: dto.email.split('@')[0],
      name: dto.name,
      email: dto.email,
      roleType: 'HIDDEN',
      password: '', // Empty password since this user won't login
    } as UserEntity);

    // Create partner linked to the new user
    const newPartner = await this.partnerRepo.create({
      userId: newUser.id,
      partnerType: dto.partnerType,
      status: dto.status ?? 1,
      createdById: userId,
    } as PartnerEntity);

    await this.cacheService.delByPattern('*partners*');

    return newPartner.toJSON() as PartnerResponseDto;
  }

  async update(
    id: string,
    dto: UpdatePartnerDto,
    userId?: string,
  ): Promise<PartnerResponseDto> {
    const partner = await this.partnerRepo.findByPk(id, {
      include: [
        {
          model: UserEntity,
          as: 'user',
        },
      ],
    });

    if (!partner) {
      throw new NotFoundException(this.i18n.t('partner.update.not_found'));
    }

    // Update user information if name or email changed
    if (dto.name || dto.email) {
      const user = await this.userRepo.findByPk(partner.userId);
      if (!user) {
        throw new NotFoundException(
          this.i18n.t('partner.update.user_not_found'),
        );
      }

      // Check if email is being changed and if it already exists
      if (dto.email && dto.email !== user.email) {
        const existingUser = await this.userRepo.findOne({
          where: { email: dto.email },
        });

        if (existingUser && existingUser.id !== user.id) {
          throw new BadRequestException(
            this.i18n.t('partner.update.email_exists'),
          );
        }
      }

      // Update user fields
      await user.update({
        name: dto.name ?? user.name,
        email: dto.email ?? user.email,
        userName: dto.email ? dto.email.split('@')[0] : user.userName,
      });
    }

    // Update partner fields
    await partner.update({
      partnerType: dto.partnerType ?? partner.partnerType,
      status: dto.status ?? partner.status,
      updatedById: userId,
    });

    await this.cacheService.delByPattern('*partners*');

    return partner.toJSON() as PartnerResponseDto;
  }

  async getList(
    params: PartnerListRequestDto,
  ): Promise<PartnerListResponseDto> {
    const { page, pageSize, sortBy, orderBy, ...filters } = params;

    // Extract nested user filters
    const userFilters: Record<string, any> = {};
    const partnerFilters: Record<string, any> = {};

    for (const key of Object.keys(filters)) {
      if (key.startsWith('user.')) {
        const userKey = key.replace('user.', '');
        userFilters[userKey] = filters[key];
      } else {
        partnerFilters[key] = filters[key];
      }
    }

    const options = buildSequelizeQuery<PartnerEntity>(
      {
        page,
        pageSize,
        sortBy,
        sortOrder: orderBy,
        filters: partnerFilters,
        subQuery: false,
        include: [
          {
            model: UserEntity,
            as: 'user',
            attributes: ['id', 'userName', 'name', 'email'],
            filters: userFilters,
            required: Object.keys(userFilters).length > 0,
          },
        ],
      },
      PartnerEntity,
    );

    const { rows, count } = await this.partnerRepo.findAndCountAll(options);

    // Get partner type labels
    const partnerTypeLabels = await this.getPartnerTypeLabels();

    return {
      data: rows.map((row) => {
        const partner = row.toJSON() as PartnerResponseDto;
        return {
          ...partner,
          partnerTypeLabel: partnerTypeLabels.get(String(partner.partnerType)),
        };
      }),
      total: count,
      page,
      pageSize,
    };
  }

  async getById(id: string): Promise<PartnerResponseDto> {
    const partner = await this.partnerRepo.findByPk(id, {
      include: [
        {
          model: UserEntity,
          as: 'user',
          attributes: ['id', 'userName', 'name', 'email'],
        },
      ],
    });

    if (!partner)
      throw new NotFoundException(this.i18n.t('partner.get.not_found'));

    // Get partner type label
    const partnerTypeLabels = await this.getPartnerTypeLabels();
    const partnerJson = partner.toJSON() as PartnerResponseDto;

    return {
      ...partnerJson,
      partnerTypeLabel: partnerTypeLabels.get(String(partnerJson.partnerType)),
    };
  }

  async delete(id: string): Promise<void> {
    const partner = await this.partnerRepo.findByPk(id);

    if (!partner) {
      throw new NotFoundException(this.i18n.t('partner.delete.not_found'));
    }

    await partner.destroy();

    await this.cacheService.delByPattern('*partners*');
  }
}
