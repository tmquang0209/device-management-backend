import {
  EDeviceStatus,
  EMaintenanceSlipDetailStatus,
  EMaintenanceSlipStatus,
} from '@common/enums';
import { buildSequelizeQuery } from '@common/utils/query-builder';
import {
  CreateMaintenanceSlipDto,
  MaintenanceSlipListRequestDto,
  MaintenanceSlipListResponseDto,
  MaintenanceSlipResponseDto,
  ReturnMaintenanceSlipDto,
  UpdateMaintenanceSlipDto,
} from '@dto';
import {
  DeviceEntity,
  DeviceTypeEntity,
  MaintenanceSlipDetailEntity,
  MaintenanceSlipEntity,
  PartnerEntity,
  UserEntity,
} from '@entities';
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
    @InjectModel(MaintenanceSlipDetailEntity)
    private readonly maintenanceSlipDetailRepo: typeof MaintenanceSlipDetailEntity,
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
   * - Validate partner exists if provided
   * - Validate devices exist and are AVAILABLE
   * - Create maintenance slip with status SENDING
   * - Create maintenance slip details for each device
   * - Update device status to MAINTENANCE
   */
  async create(
    dto: CreateMaintenanceSlipDto,
    userId?: string,
  ): Promise<MaintenanceSlipResponseDto> {
    const transaction = await this.sequelize.transaction();

    try {
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

      // Query all devices and check if they exist and are AVAILABLE
      const devices = await this.deviceRepo.findAll({
        where: { id: dto.deviceIds },
        transaction,
      });

      if (devices.length !== dto.deviceIds.length) {
        throw new BadRequestException(
          this.i18n.t('maintenance_slip.create.device_not_found'),
        );
      }

      // Check if all devices are available
      const unavailableDevices = devices.filter(
        (device) => device.status !== EDeviceStatus.AVAILABLE,
      );
      if (unavailableDevices.length > 0) {
        throw new BadRequestException(
          this.i18n.t('maintenance_slip.create.device_not_available'),
        );
      }

      // Create maintenance slip with status SENDING
      const maintenanceSlip = await this.maintenanceSlipRepo.create(
        {
          partnerId: dto.partnerId,
          reason: dto.reason,
          requestDate: dto.requestDate || new Date(),
          status: EMaintenanceSlipStatus.SENDING,
          createdById: userId,
        } as unknown as MaintenanceSlipEntity,
        { transaction },
      );

      // Create maintenance slip details for each device
      await this.maintenanceSlipDetailRepo.bulkCreate(
        devices.map((device) => ({
          maintenanceSlipId: maintenanceSlip.id,
          deviceId: device.id,
          status: EMaintenanceSlipDetailStatus.SENT,
          createdById: userId,
        })) as unknown as MaintenanceSlipDetailEntity[],
        { transaction },
      );

      // Update device status to MAINTENANCE for all devices
      await this.deviceRepo.update(
        { status: EDeviceStatus.MAINTENANCE },
        {
          where: { id: dto.deviceIds },
          transaction,
        },
      );

      await transaction.commit();

      // Clear cache
      await this.cacheService.delByPattern('*maintenance*');
      await this.cacheService.delByPattern('*devices*');

      // Reload and return
      const createdSlip = await this.maintenanceSlipRepo.findByPk(
        maintenanceSlip.id,
        {
          include: this.getDefaultIncludes(),
        },
      );

      if (!createdSlip) {
        throw new NotFoundException(
          this.i18n.t('maintenance_slip.create.not_found'),
        );
      }

      return createdSlip.toJSON() as MaintenanceSlipResponseDto;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Return devices from a maintenance slip with transaction
   * - Get maintenance slip and details
   * - Loop through items and update detail status
   * - Update device status based on return status
   * - Close maintenance slip if all items are resolved
   */
  async returnDevices(
    maintenanceSlipId: string,
    dto: ReturnMaintenanceSlipDto,
    userId?: string,
  ): Promise<MaintenanceSlipResponseDto> {
    const transaction = await this.sequelize.transaction();

    try {
      // Get maintenance slip
      const maintenanceSlip = await this.maintenanceSlipRepo.findByPk(
        maintenanceSlipId,
        {
          include: [
            {
              model: MaintenanceSlipDetailEntity,
              as: 'details',
            },
          ],
          transaction,
        },
      );

      if (!maintenanceSlip) {
        throw new NotFoundException(
          this.i18n.t('maintenance_slip.return.not_found'),
        );
      }

      // Process each return item
      for (const item of dto.items) {
        // Find the detail record
        const detail = maintenanceSlip.details?.find(
          (d) => d.deviceId === item.deviceId,
        );
        if (!detail) {
          throw new BadRequestException(
            this.i18n.t('maintenance_slip.return.device_not_in_slip'),
          );
        }

        // Update detail status and set return date
        await this.maintenanceSlipDetailRepo.update(
          {
            status: item.status,
            returnDate: new Date(),
            note: item.note,
            updatedById: userId,
          },
          {
            where: { id: detail.id },
            transaction,
          },
        );

        // Update device status based on return status
        const deviceStatus =
          item.status === EMaintenanceSlipDetailStatus.RETURNED
            ? EDeviceStatus.AVAILABLE
            : EDeviceStatus.BROKEN;

        await this.deviceRepo.update(
          { status: deviceStatus },
          {
            where: { id: item.deviceId },
            transaction,
          },
        );
      }

      // Check if all details are resolved (returned or broken)
      const updatedDetails = await this.maintenanceSlipDetailRepo.findAll({
        where: { maintenanceSlipId },
        transaction,
      });

      const allResolved = updatedDetails.every(
        (d) =>
          d.status === EMaintenanceSlipDetailStatus.RETURNED ||
          d.status === EMaintenanceSlipDetailStatus.BROKEN,
      );

      // Update maintenance slip status
      if (allResolved) {
        await this.maintenanceSlipRepo.update(
          { status: EMaintenanceSlipStatus.CLOSED },
          {
            where: { id: maintenanceSlipId },
            transaction,
          },
        );
      } else {
        // Some devices returned, but not all
        await this.maintenanceSlipRepo.update(
          { status: EMaintenanceSlipStatus.PARTIAL_RETURNED },
          {
            where: { id: maintenanceSlipId },
            transaction,
          },
        );
      }

      await transaction.commit();

      // Clear cache
      await this.cacheService.delByPattern('*maintenance*');
      await this.cacheService.delByPattern('*devices*');

      // Reload and return
      const updatedSlip = await this.maintenanceSlipRepo.findByPk(
        maintenanceSlipId,
        {
          include: this.getDefaultIncludes(),
        },
      );

      if (!updatedSlip) {
        throw new NotFoundException(
          this.i18n.t('maintenance_slip.return.not_found'),
        );
      }

      return updatedSlip.toJSON() as MaintenanceSlipResponseDto;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Cancel a maintenance slip with transaction
   * - Get maintenance slip and details
   * - Update all device statuses back to AVAILABLE
   * - Update maintenance slip status to CANCELLED
   */
  async cancel(
    id: string,
    userId?: string,
  ): Promise<MaintenanceSlipResponseDto> {
    const transaction = await this.sequelize.transaction();

    try {
      const slip = await this.maintenanceSlipRepo.findByPk(id, {
        include: [
          {
            model: MaintenanceSlipDetailEntity,
            as: 'details',
          },
        ],
        transaction,
      });

      if (!slip) {
        throw new NotFoundException(
          this.i18n.t('maintenance_slip.cancel.not_found'),
        );
      }

      // Get all devices that are still SENT (not yet returned)
      const deviceIdsToRestore = slip.details
        ?.filter((d) => d.status === EMaintenanceSlipDetailStatus.SENT)
        .map((d) => d.deviceId);

      // Update device status back to AVAILABLE
      if (deviceIdsToRestore && deviceIdsToRestore.length > 0) {
        await this.deviceRepo.update(
          { status: EDeviceStatus.AVAILABLE },
          {
            where: { id: deviceIdsToRestore },
            transaction,
          },
        );
      }

      // Update maintenance slip status to CANCELLED
      await slip.update(
        { status: EMaintenanceSlipStatus.CANCELLED, updatedById: userId },
        { transaction },
      );

      await transaction.commit();

      // Clear cache
      await this.cacheService.delByPattern('*maintenance*');
      await this.cacheService.delByPattern('*devices*');

      // Reload and return
      const cancelledSlip = await this.maintenanceSlipRepo.findByPk(id, {
        include: this.getDefaultIncludes(),
      });

      if (!cancelledSlip) {
        throw new NotFoundException(
          this.i18n.t('maintenance_slip.cancel.not_found'),
        );
      }

      return cancelledSlip.toJSON() as MaintenanceSlipResponseDto;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update a maintenance slip
   */
  async update(
    id: string,
    dto: UpdateMaintenanceSlipDto,
    userId?: string,
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

      await slip.update({ ...dto, updatedById: userId }, { transaction });

      await transaction.commit();

      // Clear cache
      await this.cacheService.delByPattern('*maintenance*');
      await this.cacheService.delByPattern('*devices*');

      // Reload and return
      const updatedSlip = await this.maintenanceSlipRepo.findByPk(id, {
        include: this.getDefaultIncludes(),
      });

      if (!updatedSlip) {
        throw new NotFoundException(
          this.i18n.t('maintenance_slip.update.not_found'),
        );
      }

      return updatedSlip.toJSON() as MaintenanceSlipResponseDto;
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
      include: this.getDefaultIncludes(),
    });

    if (!slip) {
      throw new NotFoundException(
        this.i18n.t('maintenance_slip.find.not_found'),
      );
    }

    return slip.toJSON() as MaintenanceSlipResponseDto;
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

    // Add include for partner and details
    options.include = this.getDefaultIncludes();

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
   * Find maintenance slips by partner ID
   */
  async findByPartner(
    partnerId: string,
  ): Promise<MaintenanceSlipResponseDto[]> {
    const slips = await this.maintenanceSlipRepo.findAll({
      where: { partnerId },
      include: this.getDefaultIncludes(),
      order: [['createdAt', 'DESC']],
    });

    return slips.map((slip) => slip.toJSON() as MaintenanceSlipResponseDto);
  }

  /**
   * Delete a maintenance slip with transaction (soft delete)
   */
  async delete(id: string): Promise<void> {
    const transaction = await this.sequelize.transaction();

    try {
      const slip = await this.maintenanceSlipRepo.findByPk(id, {
        include: [
          {
            model: MaintenanceSlipDetailEntity,
            as: 'details',
          },
        ],
        transaction,
      });

      if (!slip) {
        throw new NotFoundException(
          this.i18n.t('maintenance_slip.delete.not_found'),
        );
      }

      // Get all devices that are still SENT (not yet returned)
      const deviceIdsToRestore = slip.details
        ?.filter((d) => d.status === EMaintenanceSlipDetailStatus.SENT)
        .map((d) => d.deviceId);

      // Update device status back to AVAILABLE
      if (deviceIdsToRestore && deviceIdsToRestore.length > 0) {
        await this.deviceRepo.update(
          { status: EDeviceStatus.AVAILABLE },
          {
            where: { id: deviceIdsToRestore },
            transaction,
          },
        );
      }

      // Delete maintenance slip details
      await this.maintenanceSlipDetailRepo.destroy({
        where: { maintenanceSlipId: id },
        transaction,
      });

      await slip.destroy({ transaction });

      await transaction.commit();

      // Clear cache
      await this.cacheService.delByPattern('*maintenance*');
      await this.cacheService.delByPattern('*devices*');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get default includes for maintenance slip queries
   */
  private getDefaultIncludes() {
    return [
      {
        model: PartnerEntity,
        as: 'partner',
        include: [
          {
            model: UserEntity,
            as: 'user',
            attributes: ['id', 'name', 'email'],
          },
        ],
      },
      {
        model: MaintenanceSlipDetailEntity,
        as: 'details',
        include: [
          {
            model: DeviceEntity,
            as: 'device',
            attributes: ['id', 'deviceName', 'serial', 'model'],
            include: [
              {
                model: DeviceTypeEntity,
                as: 'deviceType',
                attributes: ['id', 'deviceTypeName'],
              },
            ],
          },
        ],
      },
    ];
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
