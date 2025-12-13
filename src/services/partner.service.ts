import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { I18nService } from 'nestjs-i18n';

import { buildSequelizeQuery } from '@common/utils/query-builder';
import {
  CreatePartnerDto,
  PartnerListRequestDto,
  PartnerListResponseDto,
  PartnerResponseDto,
  UpdatePartnerDto,
} from '@dto';
import { PartnerEntity, UserEntity } from '@entities';
import { CacheService } from '@services';

@Injectable()
export class PartnerService {
  constructor(
    @InjectModel(PartnerEntity)
    private readonly partnerRepo: typeof PartnerEntity,
    @InjectModel(UserEntity)
    private readonly userRepo: typeof UserEntity,
    private readonly i18n: I18nService,
    private readonly cacheService: CacheService,
  ) {}

  async create(dto: CreatePartnerDto): Promise<PartnerResponseDto> {
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

    const newPartner = await this.partnerRepo.create(dto as PartnerEntity);

    await this.cacheService.delByPattern('*partners*');

    return newPartner.toJSON() as PartnerResponseDto;
  }

  async update(id: string, dto: UpdatePartnerDto): Promise<PartnerResponseDto> {
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

    await partner.update(dto);

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

    return {
      data: rows.map((row) => row.toJSON() as PartnerResponseDto),
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

    return partner.toJSON() as PartnerResponseDto;
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
