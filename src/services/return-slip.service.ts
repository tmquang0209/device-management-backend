import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { I18nService } from 'nestjs-i18n';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

import {
  EDeviceStatus,
  EEquipmentLoanSlipDetailStatus,
  EEquipmentLoanSlipStatus,
  EEquipmentReturnSlipStatus,
} from '@common/enums';
import { buildSequelizeQuery } from '@common/utils/query-builder';
import {
  CreateReturnSlipDto,
  ReturnSlipListRequestDto,
  ReturnSlipListResponseDto,
  ReturnSlipResponseDto,
  UpdateReturnSlipDto,
} from '@dto';
import {
  DeviceEntity,
  DeviceTypeEntity,
  EquipmentLoanSlipDetailEntity,
  EquipmentLoanSlipEntity,
  EquipmentReturnSlipDetailEntity,
  EquipmentReturnSlipEntity,
  PartnerEntity,
  UserEntity,
} from '@entities';
import { AuditContextService, CacheService } from '@services';

@Injectable()
export class ReturnSlipService {
  constructor(
    @InjectModel(EquipmentReturnSlipEntity)
    private readonly returnSlipRepo: typeof EquipmentReturnSlipEntity,
    @InjectModel(EquipmentReturnSlipDetailEntity)
    private readonly returnSlipDetailRepo: typeof EquipmentReturnSlipDetailEntity,
    @InjectModel(EquipmentLoanSlipEntity)
    private readonly loanSlipRepo: typeof EquipmentLoanSlipEntity,
    @InjectModel(EquipmentLoanSlipDetailEntity)
    private readonly loanSlipDetailRepo: typeof EquipmentLoanSlipDetailEntity,
    @InjectModel(DeviceEntity)
    private readonly deviceRepo: typeof DeviceEntity,
    @InjectModel(PartnerEntity)
    private readonly partnerRepo: typeof PartnerEntity,
    private readonly sequelize: Sequelize,
    private readonly i18n: I18nService,
    private readonly cacheService: CacheService,
    private readonly auditContext: AuditContextService,
  ) {}

  /**
   * Get available loan slips for creating return slip
   * Only returns loan slips with status BORROWING or PARTIAL_RETURNED
   */
  async getAvailableLoanSlips(): Promise<EquipmentLoanSlipEntity[]> {
    const loanSlips = await this.loanSlipRepo.findAll({
      where: {
        status: {
          [Op.in]: [
            EEquipmentLoanSlipStatus.BORROWING,
            EEquipmentLoanSlipStatus.PARTIAL_RETURNED,
          ],
        },
      },
      include: [
        {
          model: UserEntity,
          as: 'createdByUser',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: PartnerEntity,
          as: 'borrower',
          include: [
            {
              model: UserEntity,
              as: 'user',
              attributes: ['id', 'name', 'email'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return loanSlips;
  }

  /**
   * Get available devices for return from a specific loan slip
   * Only returns devices that are still BORROWED (not yet returned)
   */
  async getAvailableDevicesForReturn(
    loanSlipId: string,
  ): Promise<EquipmentLoanSlipDetailEntity[]> {
    const loanSlip = await this.loanSlipRepo.findByPk(loanSlipId);
    console.log(
      '🚀 ~ ReturnSlipService ~ getAvailableDevicesForReturn ~ loanSlip:',
      loanSlip,
    );
    if (!loanSlip) {
      throw new NotFoundException(
        this.i18n.t('return_slip.loan_slip_not_found'),
      );
    }

    // Get devices that are still borrowed (status = 1)
    const availableDevices = await this.loanSlipDetailRepo.findAll({
      where: {
        equipmentLoanSlipId: loanSlipId,
        status: EEquipmentLoanSlipDetailStatus.BORROWED,
      },
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
    });
    console.log(
      '🚀 ~ ReturnSlipService ~ getAvailableDevicesForReturn ~ availableDevices:',
      availableDevices,
    );

    return availableDevices;
  }

  /**
   * Create a new return slip
   */
  async create(
    dto: CreateReturnSlipDto,
    userId?: string,
  ): Promise<ReturnSlipResponseDto> {
    const transaction = await this.sequelize.transaction();

    try {
      // Validate loan slip exists and is available for return
      const loanSlip = await this.loanSlipRepo.findByPk(dto.loanSlipId, {
        include: [
          {
            model: EquipmentLoanSlipDetailEntity,
            as: 'details',
          },
        ],
        transaction,
      });
      console.log('🚀 ~ ReturnSlipService ~ create ~ loanSlip:', loanSlip);

      if (!loanSlip) {
        throw new BadRequestException(
          this.i18n.t('return_slip.loan_slip_not_found'),
        );
      }

      if (
        loanSlip.status !== EEquipmentLoanSlipStatus.BORROWING &&
        loanSlip.status !== EEquipmentLoanSlipStatus.PARTIAL_RETURNED
      ) {
        throw new BadRequestException(
          this.i18n.t('return_slip.loan_slip_not_available'),
        );
      }

      // Validate returner exists
      const returner = await this.partnerRepo.findByPk(dto.returnerId, {
        transaction,
      });
      if (!returner) {
        throw new BadRequestException(
          this.i18n.t('return_slip.returner_not_found'),
        );
      }

      // Validate devices are from loan slip and still borrowed
      const borrowedDeviceIds =
        loanSlip.details
          ?.filter((d) => d.status === EEquipmentLoanSlipDetailStatus.BORROWED)
          .map((d) => d.deviceId) || [];

      for (const deviceItem of dto.devices) {
        if (!borrowedDeviceIds.includes(deviceItem.deviceId)) {
          throw new BadRequestException(
            this.i18n.t('return_slip.device_not_available_for_return'),
          );
        }
      }

      // Create return slip
      const returnSlip = await this.returnSlipRepo.create(
        {
          equipmentLoanSlipId: dto.loanSlipId,
          returnerId: dto.returnerId,
          returnDate: new Date(dto.returnDate),
          status: EEquipmentReturnSlipStatus.RETURNED,
          note: dto.note,
          createdById: userId,
        } as unknown as EquipmentReturnSlipEntity,
        { transaction },
      );

      // Create return slip details and update loan slip details
      for (const deviceItem of dto.devices) {
        // Create return slip detail
        await this.returnSlipDetailRepo.create(
          {
            equipmentReturnSlipId: returnSlip.id,
            deviceId: deviceItem.deviceId,
            note: deviceItem.note,
            createdById: userId,
          } as unknown as EquipmentReturnSlipDetailEntity,
          { transaction },
        );

        // Update loan slip detail status to RETURNED
        await this.loanSlipDetailRepo.update(
          {
            status: EEquipmentLoanSlipDetailStatus.RETURNED,
            returnDate: new Date(dto.returnDate),
          },
          {
            where: {
              equipmentLoanSlipId: dto.loanSlipId,
              deviceId: deviceItem.deviceId,
            },
            transaction,
          },
        );

        // Update device status to AVAILABLE
        await this.deviceRepo.update(
          { status: EDeviceStatus.AVAILABLE },
          {
            where: { id: deviceItem.deviceId },
            transaction,
          },
        );
      }

      // Check if all devices from loan slip are returned
      const updatedDetails = await this.loanSlipDetailRepo.findAll({
        where: { equipmentLoanSlipId: dto.loanSlipId },
        transaction,
      });

      const allReturned = updatedDetails.every(
        (d) =>
          d.status === EEquipmentLoanSlipDetailStatus.RETURNED ||
          d.status === EEquipmentLoanSlipDetailStatus.BROKEN,
      );

      const someReturned = updatedDetails.some(
        (d) =>
          d.status === EEquipmentLoanSlipDetailStatus.RETURNED ||
          d.status === EEquipmentLoanSlipDetailStatus.BROKEN,
      );

      // Update loan slip status
      if (allReturned) {
        await this.loanSlipRepo.update(
          { status: EEquipmentLoanSlipStatus.CLOSED },
          {
            where: { id: dto.loanSlipId },
            transaction,
          },
        );
      } else if (someReturned) {
        await this.loanSlipRepo.update(
          { status: EEquipmentLoanSlipStatus.PARTIAL_RETURNED },
          {
            where: { id: dto.loanSlipId },
            transaction,
          },
        );
      }

      await transaction.commit();

      // Clear cache
      await this.cacheService.delByPattern('*return*');
      await this.cacheService.delByPattern('*loan*');
      await this.cacheService.delByPattern('*devices*');

      return this.getById(returnSlip.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get return slip by ID
   */
  async getById(id: string): Promise<ReturnSlipResponseDto> {
    const returnSlip = await this.returnSlipRepo.findByPk(id, {
      include: [
        {
          model: EquipmentLoanSlipEntity,
          as: 'loanSlip',
          attributes: ['id', 'code', 'status'],
        },
        {
          model: PartnerEntity,
          as: 'returner',
          include: [
            {
              model: UserEntity,
              as: 'user',
              attributes: ['id', 'name', 'email'],
            },
          ],
        },
        {
          model: UserEntity,
          as: 'createdByUser',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: UserEntity,
          as: 'updatedByUser',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: EquipmentReturnSlipDetailEntity,
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
      ],
    });

    if (!returnSlip) {
      throw new NotFoundException(
        this.i18n.t('return_slip.return_slip_not_found'),
      );
    }

    return returnSlip.toJSON() as ReturnSlipResponseDto;
  }

  /**
   * Get return slip list with pagination and filters
   */
  async getList(
    params: ReturnSlipListRequestDto,
  ): Promise<ReturnSlipListResponseDto> {
    const { page, pageSize, sortBy, orderBy, ...filters } = params;
    const options = buildSequelizeQuery<EquipmentReturnSlipEntity>(
      {
        page,
        pageSize,
        sortBy,
        sortOrder: orderBy,
        filters,
        subQuery: false,
      },
      EquipmentReturnSlipEntity,
    );

    options.include = [
      {
        model: EquipmentLoanSlipEntity,
        as: 'loanSlip',
        attributes: ['id', 'code', 'status'],
      },
      {
        model: PartnerEntity,
        as: 'returner',
        include: [
          {
            model: UserEntity,
            as: 'user',
            attributes: ['id', 'name', 'email'],
          },
        ],
      },
      {
        model: UserEntity,
        as: 'createdByUser',
        attributes: ['id', 'name', 'email'],
      },
      {
        model: EquipmentReturnSlipDetailEntity,
        as: 'details',
        include: [
          {
            model: DeviceEntity,
            as: 'device',
            attributes: ['id', 'deviceName', 'serial', 'model'],
          },
        ],
      },
    ];

    const { count, rows } = await this.returnSlipRepo.findAndCountAll(options);

    return {
      data: rows.map((row) => row.toJSON() as ReturnSlipResponseDto),
      total: count,
      page: page || 1,
      pageSize: pageSize || 10,
    };
  }

  /**
   * Update return slip (only returner info and note)
   */
  async update(
    id: string,
    dto: UpdateReturnSlipDto,
    userId?: string,
  ): Promise<ReturnSlipResponseDto> {
    const transaction = await this.sequelize.transaction();

    try {
      const returnSlip = await this.returnSlipRepo.findByPk(id, {
        transaction,
      });

      if (!returnSlip) {
        throw new NotFoundException(
          this.i18n.t('return_slip.return_slip_not_found'),
        );
      }

      if (returnSlip.status === EEquipmentReturnSlipStatus.CANCELLED) {
        throw new BadRequestException(
          this.i18n.t('return_slip.cannot_update_cancelled'),
        );
      }

      // Only allow updating returner and note
      const updateData: Partial<EquipmentReturnSlipEntity> = {
        updatedById: userId,
      };

      if (dto.returnerId) {
        const returner = await this.partnerRepo.findByPk(dto.returnerId, {
          transaction,
        });
        if (!returner) {
          throw new BadRequestException(
            this.i18n.t('return_slip.returner_not_found'),
          );
        }
        updateData.returnerId = dto.returnerId;
      }

      if (dto.note !== undefined) {
        updateData.note = dto.note;
      }

      await this.returnSlipRepo.update(updateData, {
        where: { id },
        transaction,
      });

      await transaction.commit();

      // Clear cache
      await this.cacheService.delByPattern('*return*');

      return this.getById(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Cancel return slip
   * This will:
   * - Set return slip status to CANCELLED
   * - Revert loan slip detail status back to BORROWED
   * - Update device status back to ON_LOAN
   * - Update loan slip status if needed
   */
  async cancel(id: string, userId?: string): Promise<ReturnSlipResponseDto> {
    const transaction = await this.sequelize.transaction();

    try {
      const returnSlip = await this.returnSlipRepo.findByPk(id, {
        include: [
          {
            model: EquipmentReturnSlipDetailEntity,
            as: 'details',
          },
        ],
        transaction,
      });

      if (!returnSlip) {
        throw new NotFoundException(
          this.i18n.t('return_slip.return_slip_not_found'),
        );
      }

      if (returnSlip.status === EEquipmentReturnSlipStatus.CANCELLED) {
        throw new BadRequestException(
          this.i18n.t('return_slip.already_cancelled'),
        );
      }

      // Revert all returned devices
      for (const detail of returnSlip.details || []) {
        // Update loan slip detail status back to BORROWED
        await this.loanSlipDetailRepo.update(
          {
            status: EEquipmentLoanSlipDetailStatus.BORROWED,
            returnDate: null,
          },
          {
            where: {
              equipmentLoanSlipId: returnSlip.equipmentLoanSlipId,
              deviceId: detail.deviceId,
            },
            transaction,
          },
        );

        // Update device status back to ON_LOAN
        await this.deviceRepo.update(
          { status: EDeviceStatus.ON_LOAN },
          {
            where: { id: detail.deviceId },
            transaction,
          },
        );
      }

      // Update return slip status to CANCELLED
      await this.returnSlipRepo.update(
        {
          status: EEquipmentReturnSlipStatus.CANCELLED,
          updatedById: userId,
        },
        {
          where: { id },
          transaction,
        },
      );

      // Check loan slip status and update if needed
      const loanSlipDetails = await this.loanSlipDetailRepo.findAll({
        where: { equipmentLoanSlipId: returnSlip.equipmentLoanSlipId },
        transaction,
      });

      const allBorrowed = loanSlipDetails.every(
        (d) => d.status === EEquipmentLoanSlipDetailStatus.BORROWED,
      );

      if (allBorrowed) {
        await this.loanSlipRepo.update(
          { status: EEquipmentLoanSlipStatus.BORROWING },
          {
            where: { id: returnSlip.equipmentLoanSlipId },
            transaction,
          },
        );
      } else {
        await this.loanSlipRepo.update(
          { status: EEquipmentLoanSlipStatus.PARTIAL_RETURNED },
          {
            where: { id: returnSlip.equipmentLoanSlipId },
            transaction,
          },
        );
      }

      await transaction.commit();

      // Clear cache
      await this.cacheService.delByPattern('*return*');
      await this.cacheService.delByPattern('*loan*');
      await this.cacheService.delByPattern('*devices*');

      return this.getById(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
