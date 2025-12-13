import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { I18nService } from 'nestjs-i18n';
import { Sequelize } from 'sequelize-typescript';

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
} from '@dto';
import {
  DeviceEntity,
  EquipmentLoanSlipDetailEntity,
  EquipmentLoanSlipEntity,
  PartnerEntity,
  UserEntity,
  WarrantyEntity,
} from '@entities';
import { AuditContextService, CacheService } from '@services';

@Injectable()
export class LoanSlipService {
  constructor(
    @InjectModel(EquipmentLoanSlipEntity)
    private readonly loanSlipRepo: typeof EquipmentLoanSlipEntity,
    @InjectModel(EquipmentLoanSlipDetailEntity)
    private readonly loanSlipDetailRepo: typeof EquipmentLoanSlipDetailEntity,
    @InjectModel(DeviceEntity)
    private readonly deviceRepo: typeof DeviceEntity,
    @InjectModel(PartnerEntity)
    private readonly partnerRepo: typeof PartnerEntity,
    @InjectModel(UserEntity)
    private readonly userRepo: typeof UserEntity,
    @InjectModel(WarrantyEntity)
    private readonly warrantyRepo: typeof WarrantyEntity,
    private readonly sequelize: Sequelize,
    private readonly i18n: I18nService,
    private readonly cacheService: CacheService,
    private readonly auditContext: AuditContextService,
  ) {}

  /**
   * Create a new loan slip with transaction
   * - Validate borrower and loaner exist
   * - Validate devices exist and are AVAILABLE
   * - Create loan slip with status BORROWING
   * - Create loan slip details for each device
   * - Update device status to ON_LOAN
   */
  async create(dto: CreateLoanSlipDto): Promise<LoanSlipResponseDto> {
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
        } as unknown as EquipmentLoanSlipEntity,
        { transaction },
      );

      // Create loan slip details for each device
      const details = await this.loanSlipDetailRepo.bulkCreate(
        devices.map((device) => ({
          equipmentLoanSlipId: loanSlip.id,
          deviceId: device.id,
          status: EEquipmentLoanSlipDetailStatus.BORROWED,
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

    return loanSlip.toJSON() as LoanSlipResponseDto;
  }

  /**
   * Cancel a loan slip
   */
  async cancel(loanSlipId: string): Promise<void> {
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
        { status: EEquipmentLoanSlipStatus.CANCELLED },
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
}
