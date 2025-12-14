import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { I18nService } from 'nestjs-i18n';
import { Sequelize } from 'sequelize-typescript';

import {
  DEFAULT_LOAN_SLIP_DETAIL_STATUS,
  DEFAULT_LOAN_SLIP_STATUS,
  PARAM_TYPES,
} from '@common/constants';
import {
  EDeviceStatus,
  EEquipmentLoanSlipDetailStatus,
  EEquipmentLoanSlipStatus,
  EWarrantyStatus,
} from '@common/enums';
import { buildSequelizeQuery } from '@common/utils/query-builder';
import {
  CreateLoanSlipDto,
  LoanSlipListRequestDto,
  LoanSlipListResponseDto,
  LoanSlipResponseDto,
  ReturnLoanSlipDto,
  UpdateLoanSlipDto,
} from '@dto';
import {
  DeviceEntity,
  DeviceTypeEntity,
  EquipmentLoanSlipDetailEntity,
  EquipmentLoanSlipEntity,
  EquipmentReturnSlipDetailEntity,
  EquipmentReturnSlipEntity,
  ParamEntity,
  PartnerEntity,
  UserEntity,
  WarrantyEntity,
} from '@entities';
import { AuditContextService, CacheService } from '@services';

@Injectable()
export class LoanSlipService implements OnModuleInit {
  private readonly logger = new Logger(LoanSlipService.name);

  constructor(
    @InjectModel(EquipmentLoanSlipEntity)
    private readonly loanSlipRepo: typeof EquipmentLoanSlipEntity,
    @InjectModel(EquipmentLoanSlipDetailEntity)
    private readonly loanSlipDetailRepo: typeof EquipmentLoanSlipDetailEntity,
    @InjectModel(EquipmentReturnSlipEntity)
    private readonly returnSlipRepo: typeof EquipmentReturnSlipEntity,
    @InjectModel(EquipmentReturnSlipDetailEntity)
    private readonly returnSlipDetailRepo: typeof EquipmentReturnSlipDetailEntity,
    @InjectModel(DeviceEntity)
    private readonly deviceRepo: typeof DeviceEntity,
    @InjectModel(PartnerEntity)
    private readonly partnerRepo: typeof PartnerEntity,
    @InjectModel(UserEntity)
    private readonly userRepo: typeof UserEntity,
    @InjectModel(WarrantyEntity)
    private readonly warrantyRepo: typeof WarrantyEntity,
    @InjectModel(ParamEntity)
    private readonly paramRepo: typeof ParamEntity,
    private readonly sequelize: Sequelize,
    private readonly i18n: I18nService,
    private readonly cacheService: CacheService,
    private readonly auditContext: AuditContextService,
  ) {}

  /**
   * Initialize loan slip status in param table if not exists
   */
  async onModuleInit() {
    this.logger.log('Initializing loan slip status configurations...');
    await this.initLoanSlipStatus();
    await this.initLoanSlipDetailStatus();
    this.logger.log('Loan slip status configurations initialized.');
  }

  /**
   * Initialize loan slip status in param table
   */
  private async initLoanSlipStatus() {
    for (const status of DEFAULT_LOAN_SLIP_STATUS) {
      const existing = await this.paramRepo.findOne({
        where: {
          type: PARAM_TYPES.LOAN_SLIP_STATUS,
          code: status.code,
        },
      });

      if (!existing) {
        await this.paramRepo.create({
          type: PARAM_TYPES.LOAN_SLIP_STATUS,
          code: status.code,
          value: status.value,
          status: status.status,
        } as ParamEntity);
        this.logger.log(
          `Created loan slip status: ${status.code} - ${status.value}`,
        );
      }
    }
  }

  /**
   * Initialize loan slip detail status in param table
   */
  private async initLoanSlipDetailStatus() {
    for (const status of DEFAULT_LOAN_SLIP_DETAIL_STATUS) {
      const existing = await this.paramRepo.findOne({
        where: {
          type: PARAM_TYPES.LOAN_SLIP_DETAIL_STATUS,
          code: status.code,
        },
      });

      if (!existing) {
        await this.paramRepo.create({
          type: PARAM_TYPES.LOAN_SLIP_DETAIL_STATUS,
          code: status.code,
          value: status.value,
          status: status.status,
        } as ParamEntity);
        this.logger.log(
          `Created loan slip detail status: ${status.code} - ${status.value}`,
        );
      }
    }
  }

  /**
   * Get loan slip status list from param table
   */
  async getLoanSlipStatusList() {
    const statuses = await this.paramRepo.findAll({
      where: {
        type: PARAM_TYPES.LOAN_SLIP_STATUS,
        status: 1,
      },
      order: [['code', 'ASC']],
    });
    return statuses.map((s) => s.toJSON());
  }

  /**
   * Get loan slip detail status list from param table
   */
  async getLoanSlipDetailStatusList() {
    const statuses = await this.paramRepo.findAll({
      where: {
        type: PARAM_TYPES.LOAN_SLIP_DETAIL_STATUS,
        status: 1,
      },
      order: [['code', 'ASC']],
    });
    return statuses.map((s) => s.toJSON());
  }

  /**
   * Create a new loan slip with transaction
   * - Validate borrower and loaner exist
   * - Validate devices exist and are AVAILABLE
   * - Create loan slip with status BORROWING
   * - Create loan slip details for each device
   * - Update device status to ON_LOAN
   */
  async create(
    dto: CreateLoanSlipDto,
    userId?: string,
  ): Promise<LoanSlipResponseDto> {
    const transaction = await this.sequelize.transaction();

    try {
      // Validate borrower exists
      const borrower = await this.partnerRepo.findByPk(dto.borrowerId, {
        transaction,
      });
      if (!borrower) {
        throw new BadRequestException(
          this.i18n.t('loan_slip.create.borrower_not_found'),
        );
      }

      // Validate loaner exists
      const loaner = await this.partnerRepo.findByPk(dto.loanerId, {
        transaction,
      });
      if (!loaner) {
        throw new BadRequestException(
          this.i18n.t('loan_slip.create.loaner_not_found'),
        );
      }

      // Query all devices and check if they exist and are AVAILABLE
      const devices = await this.deviceRepo.findAll({
        where: { id: dto.deviceIds },
        transaction,
      });

      if (devices.length !== dto.deviceIds.length) {
        throw new BadRequestException(
          this.i18n.t('loan_slip.create.device_not_found'),
        );
      }

      // Check if all devices are available
      const unavailableDevices = devices.filter(
        (device) => device.status !== EDeviceStatus.AVAILABLE,
      );
      if (unavailableDevices.length > 0) {
        throw new BadRequestException(
          this.i18n.t('loan_slip.create.device_not_available'),
        );
      }

      // Create loan slip with status BORROWING
      const loanSlip = await this.loanSlipRepo.create(
        {
          equipmentBorrowerId: dto.borrowerId,
          equipmentLoanerId: dto.loanerId,
          status: EEquipmentLoanSlipStatus.BORROWING,
          createdById: userId,
        } as unknown as EquipmentLoanSlipEntity,
        { transaction },
      );

      // Create loan slip details for each device
      const details = await this.loanSlipDetailRepo.bulkCreate(
        devices.map((device) => ({
          equipmentLoanSlipId: loanSlip.id,
          deviceId: device.id,
          status: EEquipmentLoanSlipDetailStatus.BORROWED,
          createdById: userId,
        })) as unknown as EquipmentLoanSlipDetailEntity[],
        { transaction },
      );
      console.log('🚀 ~ LoanSlipService ~ create ~ details:', details);

      // Update device status to ON_LOAN for all devices
      await this.deviceRepo.update(
        { status: EDeviceStatus.ON_LOAN },
        {
          where: { id: dto.deviceIds },
          transaction,
        },
      );

      await transaction.commit();

      // Clear cache
      await this.cacheService.delByPattern('*loan*');
      await this.cacheService.delByPattern('*devices*');

      // Reload and return
      const createdLoanSlip = await this.loanSlipRepo.findByPk(loanSlip.id, {
        include: [
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
          {
            model: PartnerEntity,
            as: 'loaner',
            include: [
              {
                model: UserEntity,
                as: 'user',
                attributes: ['id', 'name', 'email'],
              },
            ],
          },
          {
            model: EquipmentLoanSlipDetailEntity,
            as: 'details',
            include: [
              {
                model: DeviceEntity,
                as: 'device',
                attributes: ['id', 'deviceName', 'serial', 'model'],
              },
            ],
          },
        ],
      });

      if (!createdLoanSlip) {
        throw new NotFoundException(
          this.i18n.t('loan_slip.create.loan_slip_not_found'),
        );
      }

      return createdLoanSlip.toJSON() as LoanSlipResponseDto;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Return devices from a loan slip with transaction
   * - Get loan slip and details
   * - Loop through items and update detail status
   * - Update device status based on return status
   * - Auto-create warranty if device is BROKEN
   * - Close loan slip if all items are resolved
   */
  async returnDevices(
    loanSlipId: string,
    dto: ReturnLoanSlipDto,
    userId?: string,
  ): Promise<LoanSlipResponseDto> {
    const transaction = await this.sequelize.transaction();

    try {
      // Get loan slip
      const loanSlip = await this.loanSlipRepo.findByPk(loanSlipId, {
        include: [
          {
            model: EquipmentLoanSlipDetailEntity,
            as: 'details',
          },
        ],
        transaction,
      });

      if (!loanSlip) {
        throw new NotFoundException(
          this.i18n.t('loan_slip.return.loan_slip_not_found'),
        );
      }

      // Process each return item
      for (const item of dto.items) {
        // Find the detail record
        const detail = loanSlip.details?.find(
          (d) => d.deviceId === item.deviceId,
        );
        if (!detail) {
          throw new BadRequestException(
            this.i18n.t('loan_slip.return.device_not_in_slip'),
          );
        }

        // Update detail status and set return date
        await this.loanSlipDetailRepo.update(
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
          item.status === EEquipmentLoanSlipDetailStatus.RETURNED
            ? EDeviceStatus.AVAILABLE
            : EDeviceStatus.BROKEN;

        await this.deviceRepo.update(
          { status: deviceStatus },
          {
            where: { id: item.deviceId },
            transaction,
          },
        );

        // Auto-create warranty if device is BROKEN
        if (item.status === EEquipmentLoanSlipDetailStatus.BROKEN) {
          const existingWarranty = await this.warrantyRepo.findOne({
            where: {
              deviceId: item.deviceId,
              status: [EWarrantyStatus.PENDING, EWarrantyStatus.PROCESSING],
            },
            transaction,
          });

          if (!existingWarranty) {
            await this.warrantyRepo.create(
              {
                deviceId: item.deviceId,
                reason: `Device broken during loan - ${item.note || 'No note'}`,
                requestDate: new Date(),
                status: EWarrantyStatus.PENDING,
              } as unknown as WarrantyEntity,
              { transaction },
            );
          }
        }
      }

      // Check if all details are resolved (returned or broken)
      const updatedDetails = await this.loanSlipDetailRepo.findAll({
        where: { equipmentLoanSlipId: loanSlipId },
        transaction,
      });

      const allResolved = updatedDetails.every(
        (d) =>
          d.status === EEquipmentLoanSlipDetailStatus.RETURNED ||
          d.status === EEquipmentLoanSlipDetailStatus.BROKEN,
      );

      // Update loan slip status to CLOSED if all resolved
      if (allResolved) {
        await this.loanSlipRepo.update(
          { status: EEquipmentLoanSlipStatus.CLOSED },
          {
            where: { id: loanSlipId },
            transaction,
          },
        );
      }

      await transaction.commit();

      // Clear cache
      await this.cacheService.delByPattern('*loan*');
      await this.cacheService.delByPattern('*devices*');
      await this.cacheService.delByPattern('*warranty*');

      // Reload and return
      const updatedLoanSlip = await this.loanSlipRepo.findByPk(loanSlipId, {
        include: [
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
          {
            model: PartnerEntity,
            as: 'loaner',
            include: [
              {
                model: UserEntity,
                as: 'user',
                attributes: ['id', 'name', 'email'],
              },
            ],
          },
          {
            model: EquipmentLoanSlipDetailEntity,
            as: 'details',
            include: [
              {
                model: DeviceEntity,
                as: 'device',
                attributes: ['id', 'deviceName', 'serial', 'model'],
              },
            ],
          },
        ],
      });

      if (!updatedLoanSlip) {
        throw new NotFoundException(
          this.i18n.t('loan_slip.return.loan_slip_not_found'),
        );
      }

      return updatedLoanSlip.toJSON() as LoanSlipResponseDto;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get loan slip list with pagination and filters
   */
  async getList(
    params: LoanSlipListRequestDto,
  ): Promise<LoanSlipListResponseDto> {
    const { page, pageSize, sortBy, orderBy, ...filters } = params;
    const options = buildSequelizeQuery<EquipmentLoanSlipEntity>(
      {
        page,
        pageSize,
        sortBy,
        sortOrder: orderBy,
        filters,
        subQuery: false,
      },
      EquipmentLoanSlipEntity,
    );

    // Add include for borrower, loaner, details
    options.include = [
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
      {
        model: PartnerEntity,
        as: 'loaner',
        include: [
          {
            model: UserEntity,
            as: 'user',
            attributes: ['id', 'name', 'email'],
          },
        ],
      },
      {
        model: EquipmentLoanSlipDetailEntity,
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

    const { rows, count } = await this.loanSlipRepo.findAndCountAll(options);

    return {
      data: rows.map((row) => row.toJSON() as LoanSlipResponseDto),
      total: count,
      page,
      pageSize,
    };
  }

  /**
   * Get loan slip by ID
   */
  async getById(id: string): Promise<LoanSlipResponseDto> {
    const loanSlip = await this.loanSlipRepo.findByPk(id, {
      include: [
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
        {
          model: PartnerEntity,
          as: 'loaner',
          include: [
            {
              model: UserEntity,
              as: 'user',
              attributes: ['id', 'name', 'email'],
            },
          ],
        },
        {
          model: EquipmentLoanSlipDetailEntity,
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

    if (!loanSlip) {
      throw new NotFoundException(
        this.i18n.t('loan_slip.get.loan_slip_not_found'),
      );
    }

    const result = loanSlip.toJSON();

    // Get device IDs that are returned or broken
    const returnedDeviceIds = (result.details || [])
      .filter(
        (d: any) =>
          d.status === EEquipmentLoanSlipDetailStatus.RETURNED ||
          d.status === EEquipmentLoanSlipDetailStatus.BROKEN,
      )
      .map((d: any) => d.deviceId);

    // Calculate totalReturned
    (result as any).totalReturned = returnedDeviceIds.length;

    // Query return slip details to get return slip codes for returned devices
    if (returnedDeviceIds.length > 0) {
      const returnSlipDetails = await this.returnSlipDetailRepo.findAll({
        where: {
          deviceId: returnedDeviceIds,
        },
        include: [
          {
            model: EquipmentReturnSlipEntity,
            as: 'returnSlip',
            attributes: ['id', 'code'],
            where: {
              equipmentLoanSlipId: id,
            },
            required: true,
          },
        ],
      });

      // Create a map of deviceId -> returnSlipCode
      const deviceReturnSlipMap: Record<string, string> = {};
      for (const detail of returnSlipDetails) {
        const plain = detail.toJSON();
        if (plain.returnSlip?.code) {
          deviceReturnSlipMap[plain.deviceId] = plain.returnSlip.code;
        }
      }

      // Add returnSlipCode to each detail
      for (const detail of result.details || []) {
        if (deviceReturnSlipMap[detail.deviceId]) {
          (detail as any).returnSlipCode = deviceReturnSlipMap[detail.deviceId];
        }
      }
    }

    return result as LoanSlipResponseDto;
  }

  /**
   * Cancel a loan slip
   */
  async cancel(loanSlipId: string, userId?: string): Promise<void> {
    const transaction = await this.sequelize.transaction();

    try {
      const loanSlip = await this.loanSlipRepo.findByPk(loanSlipId, {
        include: [
          {
            model: EquipmentLoanSlipDetailEntity,
            as: 'details',
          },
        ],
        transaction,
      });

      if (!loanSlip) {
        throw new NotFoundException(
          this.i18n.t('loan_slip.cancel.loan_slip_not_found'),
        );
      }

      if (loanSlip.status !== EEquipmentLoanSlipStatus.BORROWING) {
        throw new BadRequestException(
          this.i18n.t('loan_slip.cancel.cannot_cancel_loan_slip'),
        );
      }

      // Get all device IDs from details
      const deviceIds = loanSlip.details?.map((d) => d.deviceId) || [];

      // Update loan slip status to CANCELLED
      await this.loanSlipRepo.update(
        { status: EEquipmentLoanSlipStatus.CANCELLED, updatedById: userId },
        {
          where: { id: loanSlipId },
          transaction,
        },
      );

      // Update device status back to AVAILABLE
      if (deviceIds.length > 0) {
        await this.deviceRepo.update(
          { status: EDeviceStatus.AVAILABLE },
          {
            where: { id: deviceIds },
            transaction,
          },
        );
      }

      await transaction.commit();

      // Clear cache
      await this.cacheService.delByPattern('*loan*');
      await this.cacheService.delByPattern('*devices*');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update a loan slip
   * - Only allow update if status is BORROWING
   * - Can update borrower, loaner, note, and devices
   */
  async update(
    loanSlipId: string,
    dto: UpdateLoanSlipDto,
    userId?: string,
  ): Promise<LoanSlipResponseDto> {
    const transaction = await this.sequelize.transaction();

    try {
      const loanSlip = await this.loanSlipRepo.findByPk(loanSlipId, {
        include: [
          {
            model: EquipmentLoanSlipDetailEntity,
            as: 'details',
          },
        ],
        transaction,
      });

      if (!loanSlip) {
        throw new NotFoundException(
          this.i18n.t('loan_slip.update.loan_slip_not_found'),
        );
      }

      if (loanSlip.status !== EEquipmentLoanSlipStatus.BORROWING) {
        throw new BadRequestException(
          this.i18n.t('loan_slip.update.cannot_update_loan_slip'),
        );
      }

      // Validate borrower if provided
      if (dto.borrowerId) {
        const borrower = await this.partnerRepo.findByPk(dto.borrowerId, {
          transaction,
        });
        if (!borrower) {
          throw new BadRequestException(
            this.i18n.t('loan_slip.update.borrower_not_found'),
          );
        }
      }

      // Validate loaner if provided
      if (dto.loanerId) {
        const loaner = await this.partnerRepo.findByPk(dto.loanerId, {
          transaction,
        });
        if (!loaner) {
          throw new BadRequestException(
            this.i18n.t('loan_slip.update.loaner_not_found'),
          );
        }
      }

      // Update loan slip
      await this.loanSlipRepo.update(
        {
          ...(dto.borrowerId && { equipmentBorrowerId: dto.borrowerId }),
          ...(dto.loanerId && { equipmentLoanerId: dto.loanerId }),
          updatedById: userId,
        },
        {
          where: { id: loanSlipId },
          transaction,
        },
      );

      await transaction.commit();

      // Clear cache
      await this.cacheService.delByPattern('*loan*');
      await this.cacheService.delByPattern('*devices*');

      // Reload and return
      return this.getById(loanSlipId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
