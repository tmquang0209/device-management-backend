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
  async createRequest(dto: CreateWarrantyDto): Promise<WarrantyResponseDto> {
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
  ): Promise<WarrantyResponseDto> {
    const warranty = await this.warrantyRepo.findByPk(id);

    if (!warranty) {
      throw new NotFoundException(
        this.i18n.t('warranty.update.warranty_not_found'),
      );
    }

    await warranty.update(dto);

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
  async completeWarranty(id: string): Promise<WarrantyResponseDto> {
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
    await warranty.update({ status: EWarrantyStatus.COMPLETED });

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
  async rejectWarranty(id: string): Promise<WarrantyResponseDto> {
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
    await warranty.update({ status: EWarrantyStatus.REJECTED });

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
}
