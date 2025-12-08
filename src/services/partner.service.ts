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
import { PartnerEntity } from '@entities';
import { CacheService } from '@services';

@Injectable()
export class PartnerService {
  constructor(
    @InjectModel(PartnerEntity)
    private readonly partnerRepo: typeof PartnerEntity,
    private readonly i18n: I18nService,
    private readonly cacheService: CacheService,
  ) {}

  async create(dto: CreatePartnerDto): Promise<PartnerResponseDto> {
    // Check if partner with same name already exists
    const existingPartner = await this.partnerRepo.findOne({
      where: { partnerName: dto.partnerName },
    });

    if (existingPartner) {
      throw new BadRequestException(
        this.i18n.t('partner.create.already_exists'),
      );
    }

    const newPartner = await this.partnerRepo.create(dto as PartnerEntity);

    await this.cacheService.delByPattern('*partners*');

    return newPartner.toJSON();
  }

  async update(id: string, dto: UpdatePartnerDto): Promise<PartnerResponseDto> {
    const partner = await this.partnerRepo.findByPk(id);

    if (!partner) {
      throw new NotFoundException(this.i18n.t('partner.update.not_found'));
    }

    // Check if updating to existing partner name
    if (dto.partnerName) {
      const existingPartner = await this.partnerRepo.findOne({
        where: { partnerName: dto.partnerName },
      });

      if (existingPartner && existingPartner.id !== id) {
        throw new BadRequestException(
          this.i18n.t('partner.update.already_exists'),
        );
      }
    }

    await partner.update(dto);

    await this.cacheService.delByPattern('*partners*');

    return partner.toJSON();
  }

  async getList(
    params: PartnerListRequestDto,
  ): Promise<PartnerListResponseDto> {
    const { page, pageSize, sortBy, orderBy, ...filters } = params;
    const options = buildSequelizeQuery<PartnerEntity>(
      {
        page,
        pageSize,
        sortBy,
        sortOrder: orderBy,
        filters,
        subQuery: false,
      },
      PartnerEntity,
    );

    const { rows, count } = await this.partnerRepo.findAndCountAll(options);

    return {
      data: rows.map((row) => row.toJSON()),
      total: count,
      page,
      pageSize,
    };
  }

  async getById(id: string): Promise<PartnerResponseDto> {
    const partner = await this.partnerRepo.findByPk(id);

    if (!partner) {
      throw new NotFoundException(this.i18n.t('partner.get.not_found'));
    }

    return partner.toJSON();
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
