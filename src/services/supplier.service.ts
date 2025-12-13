import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { I18nService } from 'nestjs-i18n';

import { buildSequelizeQuery } from '@common/utils/query-builder';
import {
  CreateSupplierDto,
  SupplierListRequestDto,
  SupplierListResponseDto,
  SupplierResponseDto,
  UpdateSupplierDto,
} from '@dto';
import { SupplierEntity } from '@entities';
import { CacheService } from '@services';

@Injectable()
export class SupplierService {
  constructor(
    @InjectModel(SupplierEntity)
    private readonly supplierRepo: typeof SupplierEntity,
    private readonly i18n: I18nService,
    private readonly cacheService: CacheService,
  ) {}

  async create(
    dto: CreateSupplierDto,
    userId?: string,
  ): Promise<SupplierResponseDto> {
    // Check if supplier with same name already exists
    const existingSupplier = await this.supplierRepo.findOne({
      where: { supplierName: dto.supplierName },
    });

    if (existingSupplier) {
      throw new BadRequestException(
        this.i18n.t('supplier.create.already_exists'),
      );
    }

    const newSupplier = await this.supplierRepo.create({
      ...dto,
      createdById: userId,
    } as SupplierEntity);

    await this.cacheService.delByPattern('*suppliers*');

    return newSupplier.toJSON();
  }

  async update(
    id: string,
    dto: UpdateSupplierDto,
    userId?: string,
  ): Promise<SupplierResponseDto> {
    const supplier = await this.supplierRepo.findByPk(id);

    if (!supplier) {
      throw new NotFoundException(this.i18n.t('supplier.update.not_found'));
    }

    // Check if updating to existing supplier name
    if (dto.supplierName) {
      const existingSupplier = await this.supplierRepo.findOne({
        where: { supplierName: dto.supplierName },
      });

      if (existingSupplier && existingSupplier.id !== id) {
        throw new BadRequestException(
          this.i18n.t('supplier.update.already_exists'),
        );
      }
    }

    await supplier.update({ ...dto, updatedById: userId });

    await this.cacheService.delByPattern('*suppliers*');

    return supplier.toJSON();
  }

  async getList(
    params: SupplierListRequestDto,
  ): Promise<SupplierListResponseDto> {
    const { page, pageSize, sortBy, orderBy, ...filters } = params;
    const options = buildSequelizeQuery<SupplierEntity>(
      {
        page,
        pageSize,
        sortBy,
        sortOrder: orderBy,
        filters,
        subQuery: false,
      },
      SupplierEntity,
    );

    const { rows, count } = await this.supplierRepo.findAndCountAll(options);

    return {
      data: rows.map((row) => row.toJSON()),
      total: count,
      page,
      pageSize,
    };
  }

  async getById(id: string): Promise<SupplierResponseDto> {
    const supplier = await this.supplierRepo.findByPk(id);

    if (!supplier) {
      throw new NotFoundException(this.i18n.t('supplier.get.not_found'));
    }

    return supplier.toJSON();
  }

  async delete(id: string): Promise<void> {
    const supplier = await this.supplierRepo.findByPk(id);

    if (!supplier) {
      throw new NotFoundException(this.i18n.t('supplier.delete.not_found'));
    }

    await supplier.destroy();

    await this.cacheService.delByPattern('*suppliers*');
  }
}
