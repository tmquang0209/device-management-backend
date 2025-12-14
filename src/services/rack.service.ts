import { buildSequelizeQuery } from '@common/utils/query-builder';
import {
  CreateRackDto,
  RackListRequestDto,
  RackListResponseDto,
  RackResponseDto,
  UpdateRackDto,
} from '@dto';
import { DeviceLocationEntity, RackEntity } from '@entities';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CacheService } from '@services';
import { I18nService } from 'nestjs-i18n';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class RackService {
  constructor(
    @InjectModel(RackEntity)
    private readonly rackRepo: typeof RackEntity,
    @InjectModel(DeviceLocationEntity)
    private readonly deviceLocationRepo: typeof DeviceLocationEntity,
    private readonly sequelize: Sequelize,
    private readonly i18n: I18nService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Create a new rack with transaction
   * - Validate rack code uniqueness
   * - Create rack
   */
  async create(dto: CreateRackDto, userId?: string): Promise<RackResponseDto> {
    const transaction = await this.sequelize.transaction();

    try {
      // Check if rack with same code already exists (only if code is provided)
      if (dto.code) {
        const existingRack = await this.rackRepo.findOne({
          where: { code: dto.code },
          transaction,
        });

        if (existingRack) {
          throw new BadRequestException(
            this.i18n.t('rack.create.already_exists'),
          );
        }
      }

      const newRack = await this.rackRepo.create(
        { ...dto, createdById: userId } as RackEntity,
        { transaction },
      );

      await transaction.commit();

      // Clear cache
      await this.cacheService.delByPattern('*racks*');

      // Reload and return
      const createdRack = await this.rackRepo.findByPk(newRack.id);

      if (!createdRack) {
        throw new NotFoundException(this.i18n.t('rack.create.not_found'));
      }

      return createdRack.toJSON();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update a rack with transaction
   * - Validate rack exists
   * - Validate code uniqueness if changing
   * - Update rack
   */
  async update(
    id: string,
    dto: UpdateRackDto,
    userId?: string,
  ): Promise<RackResponseDto> {
    const transaction = await this.sequelize.transaction();

    try {
      const rack = await this.rackRepo.findByPk(id, {
        transaction,
      });

      if (!rack) {
        throw new NotFoundException(this.i18n.t('rack.update.not_found'));
      }

      // Check code uniqueness if changing
      if (dto.code && dto.code !== rack.code) {
        const existingRack = await this.rackRepo.findOne({
          where: { code: dto.code },
          transaction,
        });

        if (existingRack) {
          throw new BadRequestException(
            this.i18n.t('rack.update.code_already_exists'),
          );
        }
      }

      await rack.update({ ...dto, updatedById: userId }, { transaction });

      await transaction.commit();

      // Clear cache
      await this.cacheService.delByPattern('*racks*');

      // Reload and return
      const updatedRack = await this.rackRepo.findByPk(id);

      if (!updatedRack) {
        throw new NotFoundException(this.i18n.t('rack.update.not_found'));
      }

      return updatedRack.toJSON();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get rack by ID
   */
  async getById(id: string): Promise<RackResponseDto> {
    const rack = await this.rackRepo.findByPk(id);

    if (!rack) {
      throw new NotFoundException(this.i18n.t('rack.find.not_found'));
    }

    return rack.toJSON();
  }

  /**
   * Get rack list with pagination and filters
   */
  async getList(params: RackListRequestDto): Promise<RackListResponseDto> {
    const { page, pageSize, sortBy, orderBy, ...filters } = params;
    const options = buildSequelizeQuery<RackEntity>(
      {
        page,
        pageSize,
        sortBy,
        sortOrder: orderBy,
        filters,
        subQuery: false,
      },
      RackEntity,
    );

    // Eager load deviceLocations for counting
    options.include = [
      {
        model: this.deviceLocationRepo,
        attributes: ['id', 'rackId'],
        required: false,
      },
    ];

    const { rows, count } = await this.rackRepo.findAndCountAll(options);

    // Map to add count field
    const data = rows.map((row) => {
      const plain = row.toJSON();
      // deviceLocations may be undefined if not loaded
      const count = Array.isArray(plain.deviceLocations)
        ? plain.deviceLocations.length
        : 0;
      return { ...plain, count };
    });

    return {
      data,
      total: count,
      page,
      pageSize,
    };
  }

  /**
   * Legacy method for backward compatibility
   */
  async findById(id: string): Promise<RackResponseDto> {
    return this.getById(id);
  }

  /**
   * Legacy method for backward compatibility
   */
  async findAll(params: RackListRequestDto): Promise<RackListResponseDto> {
    return this.getList(params);
  }

  /**
   * Delete a rack with transaction
   */
  async delete(id: string): Promise<void> {
    const transaction = await this.sequelize.transaction();

    try {
      const rack = await this.rackRepo.findByPk(id, { transaction });
      if (!rack)
        throw new NotFoundException(this.i18n.t('rack.delete.not_found'));
      // check if rack already exists device before deleting
      const deviceLocation = await this.deviceLocationRepo.findOne({
        where: { rackId: id },
        transaction,
      });
      if (deviceLocation) {
        throw new BadRequestException(
          this.i18n.t('rack.delete.has_device_assigned'),
        );
      }
      await rack.destroy({ transaction });

      await transaction.commit();

      // Clear cache
      await this.cacheService.delByPattern('*racks*');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
