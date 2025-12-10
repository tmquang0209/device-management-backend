import { buildSequelizeQuery } from '@common/utils/query-builder';
import {
  CreateDeviceLocationDto,
  DeviceLocationListRequestDto,
  DeviceLocationResponseDto,
  UpdateDeviceLocationDto,
} from '@dto';
import { DeviceLocationEntity, RackEntity } from '@entities';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class DeviceLocationService {
  constructor(
    @InjectModel(DeviceLocationEntity)
    private readonly deviceLocationRepo: typeof DeviceLocationEntity,
    @InjectModel(RackEntity)
    private readonly rackRepo: typeof RackEntity,
    private readonly i18n: I18nService,
  ) {}

  async createDeviceLocation(
    params: CreateDeviceLocationDto,
  ): Promise<DeviceLocationResponseDto> {
    // Validate rack exists
    const rack = await this.rackRepo.findByPk(params.rackId);
    if (!rack) {
      throw new BadRequestException(
        this.i18n.t('device.location.invalid_rack'),
      );
    }

    // Check if position already exists on this rack
    if (params.xPosition && params.yPosition) {
      const existingLocation = await this.deviceLocationRepo.findOne({
        where: {
          rackId: params.rackId,
          xPosition: params.xPosition,
          yPosition: params.yPosition,
        },
      });

      if (existingLocation) {
        throw new BadRequestException(
          this.i18n.t('device.location.position_already_exists'),
        );
      }
    }

    const newLocation = await this.deviceLocationRepo.create(
      params as unknown as DeviceLocationEntity,
    );
    return newLocation.toJSON();
  }

  async updateDeviceLocation(
    id: string,
    params: UpdateDeviceLocationDto,
  ): Promise<DeviceLocationResponseDto> {
    const location = await this.deviceLocationRepo.findByPk(id);

    if (!location) {
      throw new NotFoundException(this.i18n.t('device.location.not_found'));
    }

    // Validate rack if changing
    if (params.rackId && params.rackId !== location.rackId) {
      const rack = await this.rackRepo.findByPk(params.rackId);
      if (!rack) {
        throw new BadRequestException(
          this.i18n.t('device.location.invalid_rack'),
        );
      }
    }

    // Check for duplicate position if updating
    const targetRackId = params.rackId || location.rackId;
    const targetXPosition = params.xPosition || location.xPosition;
    const targetYPosition = params.yPosition || location.yPosition;

    if (targetXPosition && targetYPosition) {
      const existingLocation = await this.deviceLocationRepo.findOne({
        where: {
          rackId: targetRackId,
          xPosition: targetXPosition,
          yPosition: targetYPosition,
        },
      });

      if (existingLocation && existingLocation.id !== id) {
        throw new BadRequestException(
          this.i18n.t('device.location.position_already_exists'),
        );
      }
    }

    await location.update(params);
    return location.toJSON();
  }

  async getListDeviceLocations(params: DeviceLocationListRequestDto) {
    const {
      page = 1,
      pageSize = 10,
      sortBy = 'createdAt',
      orderBy = 'DESC',
      ...filters
    } = params;

    const options = buildSequelizeQuery<DeviceLocationEntity>(
      {
        page,
        pageSize,
        sortBy,
        sortOrder: orderBy,
        filters,
        exclude: ['deletedAt'],
        distinct: true,
      },
      DeviceLocationEntity,
    );

    const { rows, count } =
      await this.deviceLocationRepo.findAndCountAll(options);

    return {
      data: rows.map((row) => row.toJSON()),
      total: count,
      page: Math.floor(options.offset! / options.limit!) + 1,
      pageSize: options.limit!,
    };
  }

  async getDeviceLocationById(id: string): Promise<DeviceLocationResponseDto> {
    const location = await this.deviceLocationRepo.findOne({
      where: { id },
      include: [
        {
          model: RackEntity,
          as: 'rack',
          attributes: ['id', 'code'],
        },
      ],
      attributes: {
        exclude: ['deletedAt'],
      },
    });

    if (!location) {
      throw new NotFoundException(this.i18n.t('device.location.not_found'));
    }

    return location.toJSON();
  }

  async deleteDeviceLocation(id: string): Promise<void> {
    const location = await this.deviceLocationRepo.findOne({ where: { id } });

    if (!location) {
      throw new NotFoundException(this.i18n.t('device.location.not_found'));
    }

    await location.destroy();
  }
}
