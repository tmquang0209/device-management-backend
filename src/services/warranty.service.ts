import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { I18nService } from 'nestjs-i18n';
import { Sequelize } from 'sequelize-typescript';

import { EDeviceStatus, EWarrantyStatus } from '@common/enums';
import { buildSequelizeQuery } from '@common/utils/query-builder';
import {
  CreateWarrantyDto,
  UpdateWarrantyDto,
  WarrantyListRequestDto,
  WarrantyListResponseDto,
  WarrantyResponseDto,
} from '@dto';
import { DeviceEntity, WarrantyEntity } from '@entities';
import { CacheService } from '@services';

@Injectable()
export class WarrantyService {
  constructor(
    @InjectModel(WarrantyEntity)
    private readonly warrantyRepo: typeof WarrantyEntity,
    @InjectModel(DeviceEntity)
    private readonly deviceRepo: typeof DeviceEntity,
    private readonly sequelize: Sequelize,
    private readonly i18n: I18nService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Create warranty request with transaction
   * - Check if device exists
   * - Validate requestDate <= warrantyExpirationDate
   * - Check if no existing PENDING or PROCESSING warranty
   * - Create warranty record
   * - Update device status to UNDER_WARRANTY
   */
  async createRequest(
    dto: CreateWarrantyDto,
    userId?: string,
  ): Promise<WarrantyResponseDto> {
    const transaction = await this.sequelize.transaction();

    try {
      // Check if device exists
      const device = await this.deviceRepo.findByPk(dto.deviceId, {
        transaction,
      });

      if (!device) {
        throw new NotFoundException(
          this.i18n.t('warranty.create.device_not_found'),
        );
      }

      // Validate requestDate <= warrantyExpirationDate
      if (
        device.warrantyExpirationDate &&
        new Date(dto.requestDate) > new Date(device.warrantyExpirationDate)
      ) {
        throw new BadRequestException(
          this.i18n.t('warranty.create.device_warranty_expired'),
        );
      }

      // Check if there is existing PENDING or PROCESSING warranty
      const existingWarranty = await this.warrantyRepo.findOne({
        where: {
          deviceId: dto.deviceId,
          status: [EWarrantyStatus.PENDING, EWarrantyStatus.PROCESSING],
        },
        transaction,
      });

      if (existingWarranty) {
        throw new BadRequestException(
          this.i18n.t('warranty.create.warranty_already_exists'),
        );
      }

      // Create warranty with status PENDING
      const warranty = await this.warrantyRepo.create(
        {
          deviceId: dto.deviceId,
          reason: dto.reason,
          requestDate: dto.requestDate,
          status: EWarrantyStatus.PENDING,
          createdById: userId,
        } as unknown as WarrantyEntity,
        { transaction },
      );

      // Update device status to UNDER_WARRANTY
      await this.deviceRepo.update(
        { status: EDeviceStatus.UNDER_WARRANTY },
        {
          where: { id: dto.deviceId },
          transaction,
        },
      );

      await transaction.commit();

      // Clear cache
      await this.cacheService.delByPattern('*warranty*');
      await this.cacheService.delByPattern('*devices*');

      // Reload and return
      const createdWarranty = await this.warrantyRepo.findByPk(warranty.id, {
        include: [
          {
            model: DeviceEntity,
            as: 'device',
            attributes: ['id', 'deviceName', 'serial'],
          },
        ],
      });

      if (!createdWarranty) {
        throw new NotFoundException(
          this.i18n.t('warranty.create.warranty_not_found'),
        );
      }

      return createdWarranty.toJSON();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update warranty request
   */
  async update(
    id: string,
    dto: UpdateWarrantyDto,
    userId?: string,
  ): Promise<WarrantyResponseDto> {
    const warranty = await this.warrantyRepo.findByPk(id);

    if (!warranty) {
      throw new NotFoundException(
        this.i18n.t('warranty.update.warranty_not_found'),
      );
    }

    await warranty.update({ ...dto, updatedById: userId });

    // Clear cache
    await this.cacheService.delByPattern('*warranty*');

    // Reload and return
    const updatedWarranty = await this.warrantyRepo.findByPk(id, {
      include: [
        {
          model: DeviceEntity,
          as: 'device',
          attributes: ['id', 'deviceName', 'serial'],
        },
      ],
    });

    if (!updatedWarranty) {
      throw new NotFoundException(
        this.i18n.t('warranty.update.warranty_not_found'),
      );
    }

    return updatedWarranty.toJSON();
  }

  /**
   * Get warranty list with pagination and filters
   */
  async getList(
    params: WarrantyListRequestDto,
  ): Promise<WarrantyListResponseDto> {
    const { page, pageSize, sortBy, orderBy, ...filters } = params;
    const options = buildSequelizeQuery<WarrantyEntity>(
      {
        page,
        pageSize,
        sortBy,
        sortOrder: orderBy,
        filters,
        subQuery: false,
      },
      WarrantyEntity,
    );

    // Add include for device
    options.include = [
      {
        model: DeviceEntity,
        as: 'device',
        attributes: ['id', 'deviceName', 'serial'],
      },
    ];

    const { rows, count } = await this.warrantyRepo.findAndCountAll(options);

    return {
      data: rows.map((row) => row.toJSON()),
      total: count,
      page,
      pageSize,
    };
  }

  /**
   * Get warranty by ID
   */
  async getById(id: string): Promise<WarrantyResponseDto> {
    const warranty = await this.warrantyRepo.findByPk(id, {
      include: [
        {
          model: DeviceEntity,
          as: 'device',
          attributes: ['id', 'deviceName', 'serial'],
        },
      ],
    });

    if (!warranty) {
      throw new NotFoundException(
        this.i18n.t('warranty.get.warranty_not_found'),
      );
    }

    return warranty.toJSON();
  }

  /**
   * Complete warranty
   */
  async completeWarranty(
    id: string,
    userId?: string,
  ): Promise<WarrantyResponseDto> {
    const warranty = await this.warrantyRepo.findByPk(id, {
      include: [
        {
          model: DeviceEntity,
          as: 'device',
        },
      ],
    });

    if (!warranty) {
      throw new NotFoundException(
        this.i18n.t('warranty.complete.warranty_not_found'),
      );
    }

    // Update warranty status to COMPLETED
    await warranty.update({
      status: EWarrantyStatus.COMPLETED,
      updatedById: userId,
    });

    // Update device status back to AVAILABLE
    await this.deviceRepo.update(
      { status: EDeviceStatus.AVAILABLE },
      {
        where: { id: warranty.deviceId },
      },
    );

    // Clear cache
    await this.cacheService.delByPattern('*warranty*');
    await this.cacheService.delByPattern('*devices*');

    // Reload and return
    const updatedWarranty = await this.warrantyRepo.findByPk(id, {
      include: [
        {
          model: DeviceEntity,
          as: 'device',
          attributes: ['id', 'deviceName', 'serial'],
        },
      ],
    });

    if (!updatedWarranty) {
      throw new NotFoundException(
        this.i18n.t('warranty.reject.warranty_not_found'),
      );
    }

    return updatedWarranty.toJSON();
  }

  /**
   * Reject warranty
   */
  async rejectWarranty(
    id: string,
    userId?: string,
  ): Promise<WarrantyResponseDto> {
    const warranty = await this.warrantyRepo.findByPk(id, {
      include: [
        {
          model: DeviceEntity,
          as: 'device',
        },
      ],
    });

    if (!warranty) {
      throw new NotFoundException(
        this.i18n.t('warranty.reject.warranty_not_found'),
      );
    }

    // Update warranty status to REJECTED
    await warranty.update({
      status: EWarrantyStatus.REJECTED,
      updatedById: userId,
    });

    // Update device status back to AVAILABLE (or BROKEN if device is broken)
    const newDeviceStatus = warranty.device?.status || EDeviceStatus.AVAILABLE;
    await this.deviceRepo.update(
      { status: newDeviceStatus },
      {
        where: { id: warranty.deviceId },
      },
    );

    // Clear cache
    await this.cacheService.delByPattern('*warranty*');
    await this.cacheService.delByPattern('*devices*');

    // Reload and return
    const updatedWarranty = await this.warrantyRepo.findByPk(id, {
      include: [
        {
          model: DeviceEntity,
          as: 'device',
          attributes: ['id', 'deviceName', 'serial'],
        },
      ],
    });

    if (!updatedWarranty) {
      throw new NotFoundException(
        this.i18n.t('warranty.reject.warranty_not_found'),
      );
    }

    return updatedWarranty.toJSON();
  }

  /**
   * Find warranties by device ID
   */
  async findByDevice(deviceId: string): Promise<WarrantyResponseDto[]> {
    const warranties = await this.warrantyRepo.findAll({
      where: { deviceId },
      include: [
        {
          model: DeviceEntity,
          as: 'device',
          attributes: ['id', 'deviceName', 'serial'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return warranties.map((warranty) => warranty.toJSON());
  }

  /**
   * Cancel warranty request (soft delete)
   * - Can only cancel PENDING or PROCESSING warranties
   * - Revert device status if needed
   */
  async cancelWarranty(id: string, userId?: string): Promise<void> {
    const transaction = await this.sequelize.transaction();

    try {
      const warranty = await this.warrantyRepo.findByPk(id, {
        include: [
          {
            model: DeviceEntity,
            as: 'device',
            attributes: ['id', 'status'],
          },
        ],
        transaction,
      });

      if (!warranty) {
        throw new NotFoundException(
          this.i18n.t('warranty.cancel.warranty_not_found'),
        );
      }

      // Only allow cancelling PENDING or PROCESSING warranties
      if (
        warranty.status !== EWarrantyStatus.PENDING &&
        warranty.status !== EWarrantyStatus.PROCESSING
      ) {
        throw new BadRequestException(
          this.i18n.t('warranty.cancel.invalid_status'),
        );
      }

      // Soft delete warranty
      await warranty.destroy({ transaction });

      // Update device status back to AVAILABLE if it was UNDER_WARRANTY
      if (warranty.device?.status === EDeviceStatus.UNDER_WARRANTY) {
        await this.deviceRepo.update(
          { status: EDeviceStatus.AVAILABLE },
          {
            where: { id: warranty.deviceId },
            transaction,
          },
        );
      }

      await transaction.commit();

      // Clear cache
      await this.cacheService.delByPattern('*warranty*');
      await this.cacheService.delByPattern('*devices*');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
