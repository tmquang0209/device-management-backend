import { buildSequelizeQuery } from '@common/utils';
import {
  ConfigInfoDto,
  ConfigListRequestDto,
  ConfigListResponseDto,
  CreateConfigDto,
  DeleteBatchConfigsDto,
  UpdateBatchConfigStatusDto,
  UpdateConfigDto,
} from '@dto';
import { ConfigEntity } from '@entities';
import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { I18nService } from 'nestjs-i18n';
import { Op } from 'sequelize';

@Injectable()
export class ConfigService implements OnModuleInit {
  constructor(
    @InjectModel(ConfigEntity) private readonly configRepo: typeof ConfigEntity,
    private readonly i18n: I18nService,
  ) {}

  async onModuleInit() {
    // init system config
    const keys: string[] = [
      'MAINTAINED_MODE',
      'REGISTRATION_ENABLED',
      'ENABLE_PASSWORD_RESET',
      'ENABLE_WELCOME_EMAIL',
      'ENABLE_PAYMENT',
    ];

    for (const key of keys) {
      const config = await this.configRepo.findOne({ where: { key } });
      if (!config) {
        await this.configRepo.create({
          key,
          value: 'false',
          description: `System config ${key}`,
          isActive: false,
        } as ConfigEntity);
      }
    }
  }

  async getConfigDetails(keyword: string): Promise<ConfigInfoDto> {
    const data = await this.configRepo.findOne({
      where: {
        [Op.or]: [{ key: keyword }, { id: keyword }],
      },
    });

    if (!data) {
      throw new NotFoundException(
        this.i18n.t('config.errors.config_not_found', { args: { keyword } }),
      );
    }

    return data;
  }

  async getConfigById(id: string): Promise<ConfigEntity | null> {
    const data = await this.configRepo.findByPk(id);
    if (!data) {
      throw new NotFoundException(
        this.i18n.t('config.errors.config_not_found', { args: { id } }),
      );
    }

    return data;
  }

  async getConfigByKey(key: string): Promise<ConfigEntity | null> {
    return this.configRepo.findOne({ where: { key } });
  }

  async setConfig(params: CreateConfigDto): Promise<ConfigEntity> {
    const { key, value, description, isActive, valueType } = params;
    const [config, created] = await this.configRepo.findOrCreate({
      where: { key },
      defaults: {
        key,
        value,
        description,
        isActive,
        valueType,
      } as ConfigEntity,
    });
    if (!created) {
      config.value = value;
      if (description !== undefined) {
        config.description = description;
      }
      await config.save();
    }
    return config;
  }

  async getAllConfigs(
    params: ConfigListRequestDto,
  ): Promise<ConfigListResponseDto> {
    const { page, pageSize, sortBy, orderBy, ...filters } = params;
    const options = buildSequelizeQuery<ConfigEntity>(
      {
        distinct: true,
        exclude: ['deletedAt'],
        filters,
        page,
        pageSize,
        sortBy,
        sortOrder: orderBy,
      },
      ConfigEntity,
    );

    const { rows, count } = await this.configRepo.findAndCountAll(options);
    return {
      data: rows,
      total: count,
      page: params.page || 1,
      pageSize: params.pageSize || 10,
    };
  }

  async deleteConfig(id: string): Promise<void> {
    await this.configRepo.destroy({ where: { id } });
  }

  async updateConfig(params: UpdateConfigDto): Promise<ConfigEntity> {
    const { id, key, value, description, isActive, valueType } = params;
    const where = id ? { [Op.or]: [{ id }, { key }] } : { key };

    const updateData: Partial<ConfigEntity> = {};
    if (value !== undefined) updateData.value = value;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (valueType !== undefined) updateData.valueType = valueType;

    // If nothing to update, return existing or throw if not found
    if (Object.keys(updateData).length === 0) {
      const existing = await this.configRepo.findOne({ where });
      if (!existing) {
        throw new NotFoundException(
          this.i18n.t('config.errors.config_key_not_found', { args: { key } }),
        );
      }
      return existing;
    }

    // Try a single update query (returns updated row(s) on supported DBs)
    const [affectedCount, affectedRows] = await this.configRepo.update(
      updateData,
      {
        where,
        returning: true,
      },
    );

    if (affectedCount === 0) {
      throw new NotFoundException(
        this.i18n.t('config.errors.config_key_not_found', { args: { key } }),
      );
    }

    // Prefer returned updated instance, otherwise fetch it
    const updated =
      Array.isArray(affectedRows) && affectedRows[0]
        ? affectedRows[0]
        : await this.configRepo.findOne({ where });

    return updated as ConfigEntity;
  }

  async updateConfigsBatch(
    params: UpdateBatchConfigStatusDto,
  ): Promise<ConfigEntity[]> {
    const updatedConfigs: ConfigEntity[] = [];
    const updated = await this.configRepo.update(
      { isActive: params.isActive },
      {
        where: {
          id: {
            [Op.in]: params.ids,
          },
        },
        returning: true,
      },
    );

    if (updated && Array.isArray(updated[1])) {
      return updated[1];
    }

    return updatedConfigs;
  }

  async deleteConfigsBatch(params: DeleteBatchConfigsDto): Promise<void> {
    await this.configRepo.destroy({
      where: {
        id: {
          [Op.in]: params.ids,
        },
      },
    });
  }
}
