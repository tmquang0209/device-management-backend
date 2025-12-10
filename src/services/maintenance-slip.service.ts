import { buildSequelizeQuery } from '@common/utils/query-builder';
import {
  CreateMaintenanceSlipDto,
  MaintenanceSlipListRequestDto,
  MaintenanceSlipListResponseDto,
  MaintenanceSlipResponseDto,
  UpdateMaintenanceSlipDto,
} from '@dto';
import { DeviceEntity, MaintenanceSlipEntity, PartnerEntity } from '@entities';
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
export class MaintenanceSlipService {
  constructor(
    @InjectModel(MaintenanceSlipEntity)
    private readonly maintenanceSlipRepo: typeof MaintenanceSlipEntity,
    @InjectModel(DeviceEntity)
    private readonly deviceRepo: typeof DeviceEntity,
    @InjectModel(PartnerEntity)
    private readonly partnerRepo: typeof PartnerEntity,
    private readonly sequelize: Sequelize,
    private readonly i18n: I18nService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Create a new maintenance slip with transaction
   * - Validate device exists
   * - Validate partner exists if provided
   * - Create maintenance slip
   */
  async create(
    dto: CreateMaintenanceSlipDto,
  ): Promise<MaintenanceSlipResponseDto> {
    const transaction = await this.sequelize.transaction();

    try {
      // Validate device exists
      const device = await this.deviceRepo.findByPk(dto.deviceId, {
        transaction,
      });
      if (!device) {
        throw new BadRequestException(
          this.i18n.t('maintenance_slip.create.invalid_device'),
        );
      }

      // Validate partner exists if provided
      if (dto.partnerId) {
        const partner = await this.partnerRepo.findByPk(dto.partnerId, {
          transaction,
        });
        if (!partner) {
          throw new BadRequestException(
            this.i18n.t('maintenance_slip.create.invalid_partner'),
          );
        }
      }

      const newSlip = await this.maintenanceSlipRepo.create(
        dto as MaintenanceSlipEntity,
        { transaction },
      );

      await transaction.commit();

      // Clear cache
      await this.cacheService.delByPattern('*maintenance-slips*');
      await this.cacheService.delByPattern('*devices*');

      // Reload and return
      const createdSlip = await this.maintenanceSlipRepo.findByPk(newSlip.id, {
        include: [
          {
            model: DeviceEntity,
            as: 'device',
            attributes: ['id', 'deviceName', 'serial'],
          },
          {
            model: PartnerEntity,
            as: 'partner',
            attributes: ['id', 'userId', 'partnerType'],
          },
        ],
      });

      if (!createdSlip) {
        throw new NotFoundException(
          this.i18n.t('maintenance_slip.create.not_found'),
        );
      }

      return createdSlip.toJSON();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update a maintenance slip with transaction
   * - Validate device if changing
   * - Validate partner if changing
   * - Update maintenance slip
   */
  async update(
    id: string,
    dto: UpdateMaintenanceSlipDto,
  ): Promise<MaintenanceSlipResponseDto> {
    const transaction = await this.sequelize.transaction();

    try {
      const slip = await this.maintenanceSlipRepo.findByPk(id, {
        transaction,
      });

      if (!slip) {
        throw new NotFoundException(
          this.i18n.t('maintenance_slip.update.not_found'),
        );
      }

      // Validate device if changing
      if (dto.deviceId) {
        const device = await this.deviceRepo.findByPk(dto.deviceId, {
          transaction,
        });
        if (!device) {
          throw new BadRequestException(
            this.i18n.t('maintenance_slip.update.invalid_device'),
          );
        }
      }

      // Validate partner if changing
      if (dto.partnerId) {
        const partner = await this.partnerRepo.findByPk(dto.partnerId, {
          transaction,
        });
        if (!partner) {
          throw new BadRequestException(
            this.i18n.t('maintenance_slip.update.invalid_partner'),
          );
        }
      }

      await slip.update(dto, { transaction });

      await transaction.commit();

      // Clear cache
      await this.cacheService.delByPattern('*maintenance-slips*');
      await this.cacheService.delByPattern('*devices*');

      // Reload and return
      const updatedSlip = await this.maintenanceSlipRepo.findByPk(id, {
        include: [
          {
            model: DeviceEntity,
            as: 'device',
            attributes: ['id', 'deviceName', 'serial'],
          },
          {
            model: PartnerEntity,
            as: 'partner',
            attributes: ['id', 'userId', 'partnerType'],
          },
        ],
      });

      if (!updatedSlip) {
        throw new NotFoundException(
          this.i18n.t('maintenance_slip.update.not_found'),
        );
      }

      return updatedSlip.toJSON();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get maintenance slip by ID
   */
  async getById(id: string): Promise<MaintenanceSlipResponseDto> {
    const slip = await this.maintenanceSlipRepo.findByPk(id, {
      include: [
        {
          model: DeviceEntity,
          as: 'device',
          attributes: ['id', 'deviceName', 'serial'],
        },
        {
          model: PartnerEntity,
          as: 'partner',
          attributes: ['id', 'userId', 'partnerType'],
        },
      ],
    });

    if (!slip) {
      throw new NotFoundException(
        this.i18n.t('maintenance_slip.find.not_found'),
      );
    }

    return slip.toJSON();
  }

  /**
   * Get maintenance slip list with pagination and filters
   */
  async getList(
    params: MaintenanceSlipListRequestDto,
  ): Promise<MaintenanceSlipListResponseDto> {
    const { page, pageSize, sortBy, orderBy, ...filters } = params;
    const options = buildSequelizeQuery<MaintenanceSlipEntity>(
      {
        page,
        pageSize,
        sortBy,
        sortOrder: orderBy,
        filters,
        subQuery: false,
      },
      MaintenanceSlipEntity,
    );

    // Add include for device and partner
    options.include = [
      {
        model: DeviceEntity,
        as: 'device',
        attributes: ['id', 'deviceName', 'serial'],
      },
      {
        model: PartnerEntity,
        as: 'partner',
        attributes: ['id', 'userId', 'partnerType'],
      },
    ];

    const { rows, count } =
      await this.maintenanceSlipRepo.findAndCountAll(options);

    return {
      data: rows.map((row) => row.toJSON() as MaintenanceSlipResponseDto),
      total: count,
      page,
      pageSize,
    };
  }

  /**
   * Find maintenance slips by device ID
   */
  async findByDevice(deviceId: string): Promise<MaintenanceSlipResponseDto[]> {
    const slips = await this.maintenanceSlipRepo.findAll({
      where: { deviceId },
      include: [
        {
          model: PartnerEntity,
          as: 'partner',
          attributes: ['id', 'userId', 'partnerType'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return slips.map((slip) => slip.toJSON());
  }

  /**
   * Find maintenance slips by partner ID
   */
  async findByPartner(
    partnerId: string,
  ): Promise<MaintenanceSlipResponseDto[]> {
    const slips = await this.maintenanceSlipRepo.findAll({
      where: { partnerId },
      include: [
        {
          model: DeviceEntity,
          as: 'device',
          attributes: ['id', 'deviceName', 'serial'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return slips.map((slip) => slip.toJSON());
  }

  /**
   * Delete a maintenance slip with transaction
   */
  async delete(id: string): Promise<void> {
    const transaction = await this.sequelize.transaction();

    try {
      const slip = await this.maintenanceSlipRepo.findByPk(id, {
        transaction,
      });

      if (!slip) {
        throw new NotFoundException(
          this.i18n.t('maintenance_slip.delete.not_found'),
        );
      }

      await slip.destroy({ transaction });

      await transaction.commit();

      // Clear cache
      await this.cacheService.delByPattern('*maintenance-slips*');
      await this.cacheService.delByPattern('*devices*');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async findById(id: string): Promise<MaintenanceSlipResponseDto> {
    return this.getById(id);
  }

  /**
   * Legacy method for backward compatibility
   */
  async findAll(
    params: MaintenanceSlipListRequestDto,
  ): Promise<MaintenanceSlipListResponseDto> {
    return this.getList(params);
  }
}
