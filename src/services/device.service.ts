import { buildSequelizeQuery } from '@common/utils/query-builder';
import {
  ChangeDeviceStatusDto,
  CreateDeviceDto,
  DeviceDetailResponseDto,
  DeviceListRequestDto,
  DeviceListResponseDto,
  DeviceResponseDto,
  DevicesByLocationRequestDto,
  DevicesByTypeRequestDto,
  UnassignedDevicesRequestDto,
  UpdateDeviceDto,
} from '@dto';
import {
  DeviceEntity,
  DeviceLocationEntity,
  DeviceTypeEntity,
  MaintenanceSlipEntity,
  RackEntity,
} from '@entities';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AuditContextService, CacheService } from '@services';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class DeviceService {
  constructor(
    @InjectModel(DeviceEntity)
    private readonly deviceRepo: typeof DeviceEntity,
    @InjectModel(DeviceTypeEntity)
    private readonly deviceTypeRepo: typeof DeviceTypeEntity,
    @InjectModel(RackEntity)
    private readonly rackRepo: typeof RackEntity,
    @InjectModel(DeviceLocationEntity)
    private readonly deviceLocationRepo: typeof DeviceLocationEntity,
    private readonly i18n: I18nService,
    private readonly cacheService: CacheService,
    private readonly auditContext: AuditContextService,
  ) {}

  async createDevice(params: CreateDeviceDto): Promise<DeviceResponseDto> {
    // Validate deviceType exists
    const deviceType = await this.deviceTypeRepo.findByPk(params.deviceTypeId);
    if (!deviceType) {
      throw new BadRequestException(
        this.i18n.t('device.create.invalid_device_type'),
      );
    }

    // Validate deviceLocation exists if provided
    if (params.deviceLocationId) {
      const deviceLocation = await this.deviceLocationRepo.findByPk(
        params.deviceLocationId,
      );
      if (!deviceLocation) {
        throw new BadRequestException(
          this.i18n.t('device.create.invalid_device_location'),
        );
      }
    }

    // Check for duplicate serial if provided
    if (params.serial) {
      const existingDevice = await this.deviceRepo.findOne({
        where: { serial: params.serial },
      });
      if (existingDevice) {
        throw new BadRequestException(
          this.i18n.t('device.create.serial_exists'),
        );
      }
    }

    const newDevice = await this.deviceRepo.create(params as DeviceEntity);

    // Clear cache
    await this.cacheService.delByPattern('*devices*');

    return newDevice.toJSON();
  }

  async updateDevice(
    id: string,
    params: UpdateDeviceDto,
  ): Promise<DeviceResponseDto> {
    const device = await this.deviceRepo.findByPk(id, {
      attributes: {
        exclude: ['deletedAt'],
      },
      include: [
        {
          model: DeviceTypeEntity,
          attributes: ['id', 'deviceTypeName'],
        },
        {
          model: DeviceLocationEntity,
          as: 'deviceLocation',
          attributes: ['id', 'xPosition', 'yPosition', 'status'],
          include: [
            {
              model: RackEntity,
              as: 'rack',
              attributes: ['id', 'code'],
            },
          ],
        },
      ],
    });

    if (!device) {
      throw new NotFoundException(this.i18n.t('device.update.not_found'));
    }

    this.auditContext.setAuditBefore(device);

    // Validate deviceType if provided
    if (params.deviceTypeId && params.deviceTypeId !== device.deviceTypeId) {
      const deviceType = await this.deviceTypeRepo.findByPk(
        params.deviceTypeId,
      );
      if (!deviceType) {
        throw new BadRequestException(
          this.i18n.t('device.update.invalid_device_type'),
        );
      }
    }

    // Validate deviceLocation if provided
    if (
      params.deviceLocationId &&
      params.deviceLocationId !== device.deviceLocationId
    ) {
      const deviceLocation = await this.deviceLocationRepo.findByPk(
        params.deviceLocationId,
      );
      if (!deviceLocation) {
        throw new BadRequestException(
          this.i18n.t('device.update.invalid_device_location'),
        );
      }
    }

    // Check for duplicate serial if updating
    if (params.serial && params.serial !== device.serial) {
      const existingDevice = await this.deviceRepo.findOne({
        where: { serial: params.serial },
      });
      if (existingDevice) {
        throw new BadRequestException(
          this.i18n.t('device.update.serial_exists'),
        );
      }
    }

    await device.update(params);

    // Clear cache
    await this.cacheService.delByPattern('*devices*');

    this.auditContext.setAuditAfter(device);

    return device.toJSON();
  }

  async getListDevices(
    params: DeviceListRequestDto,
  ): Promise<DeviceListResponseDto> {
    const {
      page = 1,
      pageSize = 10,
      sortBy = 'createdAt',
      orderBy = 'DESC',
      ...filters
    } = params;

    const options = buildSequelizeQuery<DeviceEntity>(
      {
        page,
        pageSize,
        sortBy,
        sortOrder: orderBy,
        filters,
        include: [
          {
            model: DeviceTypeEntity,
            attributes: ['id', 'deviceTypeName'],
            required: false,
          },
          {
            model: DeviceLocationEntity,
            as: 'deviceLocation',
            attributes: ['id', 'xPosition', 'yPosition', 'status'],
            include: [
              {
                model: RackEntity,
                as: 'rack',
                attributes: ['id', 'code', 'rows', 'cols', 'status'],
                required: false,
              },
            ],
            required: false,
          },
        ],
        exclude: ['deletedAt'],
        distinct: true,
      },
      DeviceEntity,
    );

    const { rows, count } = await this.deviceRepo.findAndCountAll(options);

    const data = rows.map((row) => row.toJSON());

    return {
      data,
      total: count,
      page: Math.floor(options.offset! / options.limit!) + 1,
      pageSize: options.limit!,
    };
  }

  async getDeviceById(id: string): Promise<DeviceDetailResponseDto> {
    const device = await this.deviceRepo.findOne({
      where: { id },
      attributes: {
        exclude: ['deletedAt'],
      },
      include: [
        {
          model: DeviceTypeEntity,
          attributes: ['id', 'deviceTypeName', 'description'],
        },
        {
          model: DeviceLocationEntity,
          as: 'deviceLocation',
          attributes: ['id', 'xPosition', 'yPosition', 'status'],
          include: [
            {
              model: RackEntity,
              as: 'rack',
              attributes: ['id', 'code', 'rows', 'cols', 'status'],
              required: false,
            },
          ],
          required: false,
        },
        {
          model: MaintenanceSlipEntity,
          as: 'maintenanceSlips',
          attributes: [
            'id',
            'transferStatus',
            'reason',
            'requestDate',
            'status',
          ],
          required: false,
        },
      ],
    });

    if (!device) {
      throw new NotFoundException(this.i18n.t('device.details.not_found'));
    }

    return device.toJSON();
  }

  async changeDeviceStatus(
    id: string,
    statusData: ChangeDeviceStatusDto,
  ): Promise<void> {
    const device = await this.deviceRepo.findOne({ where: { id } });

    if (!device) {
      throw new NotFoundException(this.i18n.t('device.status.not_found'));
    }

    this.auditContext.setAuditBefore(device);

    await device.update({ status: statusData.status });

    await this.cacheService.delByPattern('*devices*');

    this.auditContext.setAuditAfter(device);
  }

  async deleteDevice(id: string): Promise<void> {
    const device = await this.deviceRepo.findOne({ where: { id } });

    if (!device) {
      throw new NotFoundException(this.i18n.t('device.delete.not_found'));
    }

    this.auditContext.setAuditBefore(device);

    await device.destroy();

    await this.cacheService.delByPattern('*devices*');

    this.auditContext.setAuditAfter(device);
  }

  async getDevicesByType(
    deviceTypeId: string,
    params: DevicesByTypeRequestDto,
  ): Promise<DeviceListResponseDto> {
    const {
      page = 1,
      pageSize = 10,
      sortBy = 'createdAt',
      orderBy = 'DESC',
    } = params;

    const options = buildSequelizeQuery<DeviceEntity>(
      {
        page,
        pageSize,
        sortBy,
        sortOrder: orderBy,
        filters: { deviceTypeId },
        include: [
          {
            model: DeviceLocationEntity,
            attributes: ['id', 'locationName'],
          },
        ],
        exclude: ['deletedAt'],
        distinct: true,
      },
      DeviceEntity,
    );

    const { rows, count } = await this.deviceRepo.findAndCountAll(options);

    const data = rows.map((row) => row.toJSON());

    return {
      data,
      total: count,
      page: Math.floor(options.offset! / options.limit!) + 1,
      pageSize: options.limit!,
    };
  }

  async getDevicesByLocation(
    deviceLocationId: string,
    params: DevicesByLocationRequestDto,
  ): Promise<DeviceListResponseDto> {
    const {
      page = 1,
      pageSize = 10,
      sortBy = 'createdAt',
      orderBy = 'DESC',
    } = params;

    const options = buildSequelizeQuery<DeviceEntity>(
      {
        page,
        pageSize,
        sortBy,
        sortOrder: orderBy,
        filters: { deviceLocationId },
        include: [
          {
            model: DeviceTypeEntity,
            attributes: ['id', 'deviceTypeName'],
          },
        ],
        exclude: ['deletedAt'],
        distinct: true,
      },
      DeviceEntity,
    );

    const { rows, count } = await this.deviceRepo.findAndCountAll(options);

    const data = rows.map((row) => row.toJSON());

    return {
      data,
      total: count,
      page: Math.floor(options.offset! / options.limit!) + 1,
      pageSize: options.limit!,
    };
  }

  async getUnassignedDevices(
    params: UnassignedDevicesRequestDto,
  ): Promise<DeviceListResponseDto> {
    const {
      page = 1,
      pageSize = 10,
      sortBy = 'createdAt',
      orderBy = 'DESC',
      ...filters
    } = params;

    const options = buildSequelizeQuery<DeviceEntity>(
      {
        page,
        pageSize,
        sortBy,
        sortOrder: orderBy,
        filters: {
          ...filters,
          deviceLocationId: null,
        },
        include: [
          {
            model: DeviceTypeEntity,
            attributes: ['id', 'deviceTypeName'],
            required: false,
          },
        ],
        exclude: ['deletedAt'],
        distinct: true,
      },
      DeviceEntity,
    );

    const { rows, count } = await this.deviceRepo.findAndCountAll(options);

    const data = rows.map((row) => row.toJSON());

    return {
      data,
      total: count,
      page: Math.floor(options.offset! / options.limit!) + 1,
      pageSize: options.limit!,
    };
  }
}
