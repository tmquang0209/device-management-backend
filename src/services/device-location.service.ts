import { buildSequelizeQuery } from '@common/utils/query-builder';
import {
  CreateDeviceLocationDto,
  DeviceLocationListRequestDto,
  DeviceLocationResponseDto,
  UpdateDeviceLocationDto,
} from '@dto';
import { DeviceLocationEntity } from '@entities';
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
    private readonly i18n: I18nService,
  ) {}

  async createDeviceLocation(
    params: CreateDeviceLocationDto,
  ): Promise<DeviceLocationResponseDto> {
    const existingLocation = await this.deviceLocationRepo.findOne({
      where: { deviceLocationName: params.deviceLocationName },
    });

    if (existingLocation) {
      throw new BadRequestException(
        this.i18n.t('device.location.already_exists'),
      );
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

    // Check for duplicate name if updating deviceLocationName
    if (
      params.deviceLocationName &&
      params.deviceLocationName !== location.deviceLocationName
    ) {
      const existingLocation = await this.deviceLocationRepo.findOne({
        where: { deviceLocationName: params.deviceLocationName },
      });
      if (existingLocation) {
        throw new BadRequestException(
          this.i18n.t('device.location.already_exists'),
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
