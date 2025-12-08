import { buildSequelizeQuery } from '@common/utils/query-builder';
import {
  CreateDeviceTypeDto,
  DeviceTypeListRequestDto,
  DeviceTypeResponseDto,
  UpdateDeviceTypeDto,
} from '@dto';
import { DeviceTypeEntity } from '@entities';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class DeviceTypeService {
  constructor(
    @InjectModel(DeviceTypeEntity)
    private readonly deviceTypeRepo: typeof DeviceTypeEntity,
    private readonly i18n: I18nService,
  ) {}

  async createDeviceType(
    params: CreateDeviceTypeDto,
  ): Promise<DeviceTypeResponseDto> {
    const existingType = await this.deviceTypeRepo.findOne({
      where: { deviceTypeName: params.deviceTypeName },
    });

    if (existingType) {
      throw new BadRequestException(this.i18n.t('device.type.already_exists'));
    }

    const newDeviceType = await this.deviceTypeRepo.create(
      params as unknown as DeviceTypeEntity,
    );
    return newDeviceType.toJSON();
  }

  async updateDeviceType(
    id: string,
    params: UpdateDeviceTypeDto,
  ): Promise<DeviceTypeResponseDto> {
    const deviceType = await this.deviceTypeRepo.findByPk(id);

    if (!deviceType) {
      throw new NotFoundException(this.i18n.t('device.type.not_found'));
    }

    // Check for duplicate name if updating deviceTypeName
    if (
      params.deviceTypeName &&
      params.deviceTypeName !== deviceType.deviceTypeName
    ) {
      const existingType = await this.deviceTypeRepo.findOne({
        where: { deviceTypeName: params.deviceTypeName },
      });
      if (existingType) {
        throw new BadRequestException(
          this.i18n.t('device.type.already_exists'),
        );
      }
    }

    await deviceType.update(params);
    return deviceType.toJSON();
  }

  async getListDeviceTypes(params: DeviceTypeListRequestDto) {
    const {
      page = 1,
      pageSize = 10,
      sortBy = 'createdAt',
      orderBy = 'DESC',
      ...filters
    } = params;

    const options = buildSequelizeQuery<DeviceTypeEntity>(
      {
        page,
        pageSize,
        sortBy,
        sortOrder: orderBy,
        filters,
        exclude: ['deletedAt'],
        distinct: true,
      },
      DeviceTypeEntity,
    );

    const { rows, count } = await this.deviceTypeRepo.findAndCountAll(options);

    return {
      data: rows.map((row) => row.toJSON()),
      total: count,
      page: Math.floor(options.offset! / options.limit!) + 1,
      pageSize: options.limit!,
    };
  }

  async getDeviceTypeById(id: string): Promise<DeviceTypeResponseDto> {
    const deviceType = await this.deviceTypeRepo.findOne({
      where: { id },
      attributes: {
        exclude: ['deletedAt'],
      },
    });

    if (!deviceType) {
      throw new NotFoundException(this.i18n.t('device.type.not_found'));
    }

    return deviceType.toJSON();
  }

  async deleteDeviceType(id: string): Promise<void> {
    const deviceType = await this.deviceTypeRepo.findOne({ where: { id } });

    if (!deviceType) {
      throw new NotFoundException(this.i18n.t('device.type.not_found'));
    }

    await deviceType.destroy();
  }
}
