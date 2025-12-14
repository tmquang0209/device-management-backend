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
    // Validate user exists
    const user = await this.userRepo.findByPk(dto.userId);
    if (!user) {
      throw new BadRequestException(this.i18n.t('partner.create.invalid_user'));
    }

    // Check if partner already exists for this user
    const existingPartner = await this.partnerRepo.findOne({
      where: { userId: dto.userId },
    });

    if (existingPartner) {
      throw new BadRequestException(
        this.i18n.t('partner.create.already_exists'),
      );
    }

    const newPartner = await this.partnerRepo.create({
      ...dto,
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
    const partner = await this.partnerRepo.findByPk(id);

    if (!partner) {
      throw new NotFoundException(this.i18n.t('partner.update.not_found'));
    }

    // Validate user if changing
    if (dto.userId && dto.userId !== partner.userId) {
      const user = await this.userRepo.findByPk(dto.userId);
      if (!user) {
        throw new BadRequestException(
          this.i18n.t('partner.update.invalid_user'),
        );
      }

      // Check if another partner already exists for this user
      const existingPartner = await this.partnerRepo.findOne({
        where: { userId: dto.userId },
      });

      if (existingPartner && existingPartner.id !== id) {
        throw new BadRequestException(
          this.i18n.t('partner.update.already_exists'),
        );
      }
    }

    await partner.update({ ...dto, updatedById: userId });

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
