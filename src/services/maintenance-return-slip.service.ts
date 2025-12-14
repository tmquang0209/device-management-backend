import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as dayjs from 'dayjs';
import { I18nService } from 'nestjs-i18n';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

import {
  DEFAULT_MAINTENANCE_RETURN_SLIP_DETAIL_STATUS,
  DEFAULT_MAINTENANCE_RETURN_SLIP_PREFIX,
  DEFAULT_MAINTENANCE_RETURN_SLIP_STATUS,
  PARAM_TYPES,
} from '@common/constants';
import {
  EDeviceStatus,
  EMaintenanceReturnSlipStatus,
  EMaintenanceSlipDetailStatus,
  EMaintenanceSlipStatus,
} from '@common/enums';
import { buildSequelizeQuery } from '@common/utils/query-builder';
import {
  CreateMaintenanceReturnSlipDto,
  MaintenanceReturnSlipListRequestDto,
  MaintenanceReturnSlipListResponseDto,
  MaintenanceReturnSlipResponseDto,
  UpdateMaintenanceReturnSlipDto,
} from '@dto';
import {
  DeviceEntity,
  DeviceTypeEntity,
  MaintenanceReturnSlipDetailEntity,
  MaintenanceReturnSlipEntity,
  MaintenanceSlipDetailEntity,
  MaintenanceSlipEntity,
  ParamEntity,
  PartnerEntity,
  UserEntity,
} from '@entities';
import { CacheService } from '@services';

@Injectable()
export class MaintenanceReturnSlipService implements OnModuleInit {
  private readonly logger = new Logger(MaintenanceReturnSlipService.name);

  constructor(
    @InjectModel(MaintenanceReturnSlipEntity)
    private readonly maintenanceReturnSlipRepo: typeof MaintenanceReturnSlipEntity,
    @InjectModel(MaintenanceReturnSlipDetailEntity)
    private readonly maintenanceReturnSlipDetailRepo: typeof MaintenanceReturnSlipDetailEntity,
    @InjectModel(MaintenanceSlipEntity)
    private readonly maintenanceSlipRepo: typeof MaintenanceSlipEntity,
    @InjectModel(MaintenanceSlipDetailEntity)
    private readonly maintenanceSlipDetailRepo: typeof MaintenanceSlipDetailEntity,
    @InjectModel(DeviceEntity)
    private readonly deviceRepo: typeof DeviceEntity,
    @InjectModel(ParamEntity)
    private readonly paramRepo: typeof ParamEntity,
    private readonly sequelize: Sequelize,
    private readonly i18n: I18nService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Initialize maintenance return slip configurations in param table if not exists
   */
  async onModuleInit() {
    this.logger.log(
      'Initializing maintenance return slip status configurations...',
    );
    await this.initMaintenanceReturnSlipStatus();
    await this.initMaintenanceReturnSlipDetailStatus();
    await this.initMaintenanceReturnSlipPrefix();
    this.logger.log(
      'Maintenance return slip status configurations initialized.',
    );
  }

  /**
   * Initialize maintenance return slip status in param table
   */
  private async initMaintenanceReturnSlipStatus() {
    for (const status of DEFAULT_MAINTENANCE_RETURN_SLIP_STATUS) {
      const existing = await this.paramRepo.findOne({
        where: {
          type: PARAM_TYPES.MAINTENANCE_RETURN_SLIP_STATUS,
          code: status.code,
        },
      });

      if (!existing) {
        await this.paramRepo.create({
          type: PARAM_TYPES.MAINTENANCE_RETURN_SLIP_STATUS,
          code: status.code,
          value: status.value,
          status: status.status,
        } as ParamEntity);
        this.logger.log(
          `Created maintenance return slip status: ${status.code} - ${status.value}`,
        );
      }
    }
  }

  /**
   * Initialize maintenance return slip detail status in param table
   */
  private async initMaintenanceReturnSlipDetailStatus() {
    for (const status of DEFAULT_MAINTENANCE_RETURN_SLIP_DETAIL_STATUS) {
      const existing = await this.paramRepo.findOne({
        where: {
          type: PARAM_TYPES.MAINTENANCE_RETURN_SLIP_DETAIL_STATUS,
          code: status.code,
        },
      });

      if (!existing) {
        await this.paramRepo.create({
          type: PARAM_TYPES.MAINTENANCE_RETURN_SLIP_DETAIL_STATUS,
          code: status.code,
          value: status.value,
          status: status.status,
        } as ParamEntity);
        this.logger.log(
          `Created maintenance return slip detail status: ${status.code} - ${status.value}`,
        );
      }
    }
  }

  /**
   * Initialize maintenance return slip prefix in param table
   */
  private async initMaintenanceReturnSlipPrefix() {
    for (const prefix of DEFAULT_MAINTENANCE_RETURN_SLIP_PREFIX) {
      const existing = await this.paramRepo.findOne({
        where: {
          type: PARAM_TYPES.MAINTENANCE_RETURN_SLIP_PREFIX,
          code: prefix.code,
        },
      });

      if (!existing) {
        await this.paramRepo.create({
          type: PARAM_TYPES.MAINTENANCE_RETURN_SLIP_PREFIX,
          code: prefix.code,
          value: prefix.value,
          status: prefix.status,
        } as ParamEntity);
        this.logger.log(
          `Created maintenance return slip prefix: ${prefix.code} - ${prefix.value}`,
        );
      }
    }
  }

  /**
   * Get maintenance return slip status list from param table
   */
  async getMaintenanceReturnSlipStatusList() {
    const statuses = await this.paramRepo.findAll({
      where: {
        type: PARAM_TYPES.MAINTENANCE_RETURN_SLIP_STATUS,
        status: 1,
      },
      order: [['code', 'ASC']],
    });
    return statuses.map((s) => s.toJSON());
  }

  /**
   * Get maintenance return slip detail status list from param table
   */
  async getMaintenanceReturnSlipDetailStatusList() {
    const statuses = await this.paramRepo.findAll({
      where: {
        type: PARAM_TYPES.MAINTENANCE_RETURN_SLIP_DETAIL_STATUS,
        status: 1,
      },
      order: [['code', 'ASC']],
    });
    return statuses.map((s) => s.toJSON());
  }

  /**
   * Get maintenance return slip prefix from param table
   */
  async getMaintenanceReturnSlipPrefix(): Promise<string> {
    const prefix = await this.paramRepo.findOne({
      where: {
        type: PARAM_TYPES.MAINTENANCE_RETURN_SLIP_PREFIX,
        code: 'PREFIX',
        status: 1,
      },
    });
    return prefix?.value || 'GDBT';
  }

  /**
   * Generate unique code for maintenance return slip
   * Format: {PREFIX}_{YYMMDD}_{SEQ}
   */
  private async generateCode(): Promise<string> {
    const prefix = await this.getMaintenanceReturnSlipPrefix();
    const now = dayjs();
    const dateFormat = now.format('YYMMDD');
    const startOfDay = now.startOf('day').toDate();
    const endOfDay = now.endOf('day').toDate();

    const count = await this.maintenanceReturnSlipRepo.count({
      where: {
        createdAt: {
          [Op.between]: [startOfDay, endOfDay],
        },
      },
    });

    return `${prefix}_${dateFormat}_${String(count + 1).padStart(3, '0')}`;
  }

  /**
   * Get available maintenance slips for creating return slip
   * Only returns maintenance slips with status SENDING or PARTIAL_RETURNED
   */
  async getAvailableMaintenanceSlips(): Promise<MaintenanceSlipEntity[]> {
    const maintenanceSlips = await this.maintenanceSlipRepo.findAll({
      where: {
        status: {
          [Op.in]: [
            EMaintenanceSlipStatus.SENDING,
            EMaintenanceSlipStatus.PARTIAL_RETURNED,
          ],
        },
      },
      include: [
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
      ],
      order: [['createdAt', 'DESC']],
    });

    return maintenanceSlips;
  }

  /**
   * Get available devices for return from a specific maintenance slip
   * Only returns devices that are still SENT (not yet returned)
   */
  async getAvailableDevicesForReturn(
    maintenanceSlipId: string,
  ): Promise<MaintenanceSlipDetailEntity[]> {
    const maintenanceSlip =
      await this.maintenanceSlipRepo.findByPk(maintenanceSlipId);
    if (!maintenanceSlip) {
      throw new NotFoundException(
        this.i18n.t('maintenance_return_slip.maintenance_slip_not_found'),
      );
    }

    // Get devices that are still sent (status = 1)
    const availableDevices = await this.maintenanceSlipDetailRepo.findAll({
      where: {
        maintenanceSlipId: maintenanceSlipId,
        status: EMaintenanceSlipDetailStatus.SENT,
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

    return availableDevices;
  }

  /**
   * Create a new maintenance return slip
   */
  async create(
    dto: CreateMaintenanceReturnSlipDto,
    userId?: string,
  ): Promise<MaintenanceReturnSlipResponseDto> {
    const transaction = await this.sequelize.transaction();

    try {
      // Validate maintenance slip exists and is available for return
      const maintenanceSlip = await this.maintenanceSlipRepo.findByPk(
        dto.maintenanceSlipId,
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
        throw new BadRequestException(
          this.i18n.t('maintenance_return_slip.maintenance_slip_not_found'),
        );
      }

      if (
        maintenanceSlip.status !== EMaintenanceSlipStatus.SENDING &&
        maintenanceSlip.status !== EMaintenanceSlipStatus.PARTIAL_RETURNED
      ) {
        throw new BadRequestException(
          this.i18n.t('maintenance_return_slip.maintenance_slip_not_available'),
        );
      }

      // Validate devices are from maintenance slip and still sent
      const sentDeviceIds =
        maintenanceSlip.details
          ?.filter((d) => d.status === EMaintenanceSlipDetailStatus.SENT)
          .map((d) => d.deviceId) || [];

      for (const deviceItem of dto.devices) {
        if (!sentDeviceIds.includes(deviceItem.deviceId)) {
          throw new BadRequestException(
            this.i18n.t(
              'maintenance_return_slip.device_not_available_for_return',
            ),
          );
        }

        // Validate status is either RETURNED or BROKEN
        if (
          deviceItem.status !== EMaintenanceSlipDetailStatus.RETURNED &&
          deviceItem.status !== EMaintenanceSlipDetailStatus.BROKEN
        ) {
          throw new BadRequestException(
            this.i18n.t('maintenance_return_slip.invalid_device_status'),
          );
        }
      }

      // Generate code from param table prefix
      const code = await this.generateCode();

      // Create maintenance return slip
      const maintenanceReturnSlip = await this.maintenanceReturnSlipRepo.create(
        {
          code,
          maintenanceSlipId: dto.maintenanceSlipId,
          status: EMaintenanceReturnSlipStatus.RETURNED,
          createdBy: userId,
        } as unknown as MaintenanceReturnSlipEntity,
        { transaction },
      );

      // Create maintenance return slip details and update maintenance slip details
      for (const deviceItem of dto.devices) {
        // Create maintenance return slip detail
        await this.maintenanceReturnSlipDetailRepo.create(
          {
            maintenanceReturnSlipId: maintenanceReturnSlip.id,
            deviceId: deviceItem.deviceId,
            note: deviceItem.note,
            createdBy: userId,
          } as unknown as MaintenanceReturnSlipDetailEntity,
          { transaction },
        );

        // Update maintenance slip detail status
        await this.maintenanceSlipDetailRepo.update(
          {
            status: deviceItem.status,
            returnDate: new Date(dto.returnDate),
            note: deviceItem.note,
            updatedById: userId,
          },
          {
            where: {
              maintenanceSlipId: dto.maintenanceSlipId,
              deviceId: deviceItem.deviceId,
            },
            transaction,
          },
        );

        // Update device status based on return status
        const deviceStatus =
          deviceItem.status === EMaintenanceSlipDetailStatus.RETURNED
            ? EDeviceStatus.AVAILABLE
            : EDeviceStatus.BROKEN;

        await this.deviceRepo.update(
          { status: deviceStatus },
          {
            where: { id: deviceItem.deviceId },
            transaction,
          },
        );
      }

      // Check if all devices from maintenance slip are resolved
      const updatedDetails = await this.maintenanceSlipDetailRepo.findAll({
        where: { maintenanceSlipId: dto.maintenanceSlipId },
        transaction,
      });

      const allResolved = updatedDetails.every(
        (d) =>
          d.status === EMaintenanceSlipDetailStatus.RETURNED ||
          d.status === EMaintenanceSlipDetailStatus.BROKEN,
      );

      const someResolved = updatedDetails.some(
        (d) =>
          d.status === EMaintenanceSlipDetailStatus.RETURNED ||
          d.status === EMaintenanceSlipDetailStatus.BROKEN,
      );

      // Update maintenance slip status
      if (allResolved) {
        await this.maintenanceSlipRepo.update(
          { status: EMaintenanceSlipStatus.CLOSED },
          {
            where: { id: dto.maintenanceSlipId },
            transaction,
          },
        );
      } else if (someResolved) {
        await this.maintenanceSlipRepo.update(
          { status: EMaintenanceSlipStatus.PARTIAL_RETURNED },
          {
            where: { id: dto.maintenanceSlipId },
            transaction,
          },
        );
      }

      await transaction.commit();

      // Clear cache
      await this.cacheService.delByPattern('*maintenance*');
      await this.cacheService.delByPattern('*devices*');

      return this.getById(maintenanceReturnSlip.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get maintenance return slip by ID
   */
  async getById(id: string): Promise<MaintenanceReturnSlipResponseDto> {
    const maintenanceReturnSlip = await this.maintenanceReturnSlipRepo.findByPk(
      id,
      {
        include: [
          {
            model: MaintenanceSlipEntity,
            as: 'maintenanceSlip',
            attributes: ['id', 'code', 'status'],
            include: [
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
            ],
          },
          {
            model: UserEntity,
            as: 'creator',
            attributes: ['id', 'name', 'email'],
          },
          {
            model: UserEntity,
            as: 'updater',
            attributes: ['id', 'name', 'email'],
          },
          {
            model: MaintenanceReturnSlipDetailEntity,
            as: 'maintenanceReturnSlipDetails',
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
      },
    );

    if (!maintenanceReturnSlip) {
      throw new NotFoundException(
        this.i18n.t('maintenance_return_slip.not_found'),
      );
    }

    return maintenanceReturnSlip.toJSON() as unknown as MaintenanceReturnSlipResponseDto;
  }

  /**
   * Get maintenance return slip list with pagination and filters
   */
  async getList(
    params: MaintenanceReturnSlipListRequestDto,
  ): Promise<MaintenanceReturnSlipListResponseDto> {
    const { page, pageSize, sortBy, orderBy, ...filters } = params;
    const options = buildSequelizeQuery<MaintenanceReturnSlipEntity>(
      {
        page,
        pageSize,
        sortBy,
        sortOrder: orderBy,
        filters,
        subQuery: false,
      },
      MaintenanceReturnSlipEntity,
    );

    options.include = [
      {
        model: MaintenanceSlipEntity,
        as: 'maintenanceSlip',
        attributes: ['id', 'code', 'status'],
        include: [
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
        ],
      },
      {
        model: UserEntity,
        as: 'creator',
        attributes: ['id', 'name', 'email'],
      },
      {
        model: MaintenanceReturnSlipDetailEntity,
        as: 'maintenanceReturnSlipDetails',
        include: [
          {
            model: DeviceEntity,
            as: 'device',
            attributes: ['id', 'deviceName', 'serial', 'model'],
          },
        ],
      },
    ];

    const { count, rows } =
      await this.maintenanceReturnSlipRepo.findAndCountAll(options);

    return {
      data: rows.map(
        (row) => row.toJSON() as unknown as MaintenanceReturnSlipResponseDto,
      ),
      total: count,
      page: page || 1,
      pageSize: pageSize || 10,
    };
  }

  /**
   * Update maintenance return slip (only note)
   */
  async update(
    id: string,
    dto: UpdateMaintenanceReturnSlipDto,
    userId?: string,
  ): Promise<MaintenanceReturnSlipResponseDto> {
    const transaction = await this.sequelize.transaction();

    try {
      const maintenanceReturnSlip =
        await this.maintenanceReturnSlipRepo.findByPk(id, {
          transaction,
        });

      if (!maintenanceReturnSlip) {
        throw new NotFoundException(
          this.i18n.t('maintenance_return_slip.not_found'),
        );
      }

      if (
        maintenanceReturnSlip.status ===
        (EMaintenanceReturnSlipStatus.CANCELLED as number)
      ) {
        throw new BadRequestException(
          this.i18n.t('maintenance_return_slip.cannot_update_cancelled'),
        );
      }

      await maintenanceReturnSlip.update(
        {
          ...dto,
          updatedBy: userId,
        },
        { transaction },
      );

      await transaction.commit();

      // Clear cache
      await this.cacheService.delByPattern('*maintenance*');

      return this.getById(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Cancel maintenance return slip
   * - Reverts device statuses back to MAINTENANCE
   * - Reverts maintenance slip detail statuses back to SENT
   * - Updates maintenance slip status accordingly
   */
  async cancel(
    id: string,
    userId?: string,
  ): Promise<MaintenanceReturnSlipResponseDto> {
    const transaction = await this.sequelize.transaction();

    try {
      const maintenanceReturnSlip =
        await this.maintenanceReturnSlipRepo.findByPk(id, {
          include: [
            {
              model: MaintenanceReturnSlipDetailEntity,
              as: 'maintenanceReturnSlipDetails',
            },
            {
              model: MaintenanceSlipEntity,
              as: 'maintenanceSlip',
            },
          ],
          transaction,
        });

      if (!maintenanceReturnSlip) {
        throw new NotFoundException(
          this.i18n.t('maintenance_return_slip.not_found'),
        );
      }

      if (
        maintenanceReturnSlip.status ===
        (EMaintenanceReturnSlipStatus.CANCELLED as number)
      ) {
        throw new BadRequestException(
          this.i18n.t('maintenance_return_slip.already_cancelled'),
        );
      }

      // Get device IDs from return slip details
      const deviceIds =
        maintenanceReturnSlip.maintenanceReturnSlipDetails?.map(
          (d) => d.deviceId,
        ) || [];

      // Revert maintenance slip detail statuses back to SENT
      for (const deviceId of deviceIds) {
        await this.maintenanceSlipDetailRepo.update(
          {
            status: EMaintenanceSlipDetailStatus.SENT,
            returnDate: null,
            updatedById: userId,
          },
          {
            where: {
              maintenanceSlipId: maintenanceReturnSlip.maintenanceSlipId,
              deviceId: deviceId,
            },
            transaction,
          },
        );

        // Revert device status back to MAINTENANCE
        await this.deviceRepo.update(
          { status: EDeviceStatus.MAINTENANCE },
          {
            where: { id: deviceId },
            transaction,
          },
        );
      }

      // Update maintenance slip status
      // Check if there are still any resolved devices
      const remainingDetails = await this.maintenanceSlipDetailRepo.findAll({
        where: { maintenanceSlipId: maintenanceReturnSlip.maintenanceSlipId },
        transaction,
      });

      const hasResolvedDevices = remainingDetails.some(
        (d) =>
          d.status === EMaintenanceSlipDetailStatus.RETURNED ||
          d.status === EMaintenanceSlipDetailStatus.BROKEN,
      );

      if (hasResolvedDevices) {
        await this.maintenanceSlipRepo.update(
          { status: EMaintenanceSlipStatus.PARTIAL_RETURNED },
          {
            where: { id: maintenanceReturnSlip.maintenanceSlipId },
            transaction,
          },
        );
      } else {
        await this.maintenanceSlipRepo.update(
          { status: EMaintenanceSlipStatus.SENDING },
          {
            where: { id: maintenanceReturnSlip.maintenanceSlipId },
            transaction,
          },
        );
      }

      // Update return slip status to CANCELLED
      await maintenanceReturnSlip.update(
        {
          status: EMaintenanceReturnSlipStatus.CANCELLED,
          updatedBy: userId,
        },
        { transaction },
      );

      await transaction.commit();

      // Clear cache
      await this.cacheService.delByPattern('*maintenance*');
      await this.cacheService.delByPattern('*devices*');

      return this.getById(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
