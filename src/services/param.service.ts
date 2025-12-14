import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { I18nService } from 'nestjs-i18n';

import { buildSequelizeQuery } from '@common/utils/query-builder';
import {
  CreateParamDto,
  ParamListRequestDto,
  ParamListResponseDto,
  ParamResponseDto,
  UpdateParamDto,
} from '@dto';
import { ParamEntity } from '@entities';
import { CacheService } from '@services';

@Injectable()
export class ParamService {
  constructor(
    @InjectModel(ParamEntity)
    private readonly paramRepo: typeof ParamEntity,
    private readonly i18n: I18nService,
    private readonly cacheService: CacheService,
  ) {}

  async create(
    dto: CreateParamDto,
    userId?: string,
  ): Promise<ParamResponseDto> {
    // Check if param with same type and code already exists
    const existingParam = await this.paramRepo.findOne({
      where: { type: dto.type, code: dto.code },
    });

    if (existingParam) {
      throw new BadRequestException(this.i18n.t('param.create.already_exists'));
    }

    const newParam = await this.paramRepo.create({
      ...dto,
      createdById: userId,
    } as ParamEntity);

    await this.cacheService.delByPattern('*params*');

    return newParam.toJSON();
  }

  async update(
    id: string,
    dto: UpdateParamDto,
    userId?: string,
  ): Promise<ParamResponseDto> {
    console.log('🚀 ~ ParamService ~ update ~ dto:', dto);
    const param = await this.paramRepo.findByPk(id);

    if (!param) {
      throw new NotFoundException(this.i18n.t('param.update.not_found'));
    }

    // Check if updating to existing type/code combination
    if (dto.type || dto.code) {
      const existingParam = await this.paramRepo.findOne({
        where: {
          type: dto.type || param.type,
          code: dto.code || param.code,
        },
      });

      if (existingParam && existingParam.id !== id) {
        throw new BadRequestException(
          this.i18n.t('param.update.already_exists'),
        );
      }
    }

    await param.update({ ...dto, updatedById: userId });

    await this.cacheService.delByPattern('*params*');

    return param.toJSON();
  }

  async getList(params: ParamListRequestDto): Promise<ParamListResponseDto> {
    const { page, pageSize, sortBy, orderBy, ...filters } = params;
    const options = buildSequelizeQuery<ParamEntity>(
      {
        page,
        pageSize,
        sortBy,
        sortOrder: orderBy,
        filters,
        subQuery: false,
      },
      ParamEntity,
    );

    const { rows, count } = await this.paramRepo.findAndCountAll(options);

    return {
      data: rows.map((row) => row.toJSON()),
      total: count,
      page,
      pageSize,
    };
  }

  async getById(id: string): Promise<ParamResponseDto> {
    const param = await this.paramRepo.findByPk(id);

    if (!param) {
      throw new NotFoundException(this.i18n.t('param.get.not_found'));
    }

    return param.toJSON();
  }

  async delete(id: string): Promise<void> {
    const param = await this.paramRepo.findByPk(id);

    if (!param) {
      throw new NotFoundException(this.i18n.t('param.delete.not_found'));
    }

    await param.destroy();

    await this.cacheService.delByPattern('*params*');
  }

  async getByTypeAndCode(
    type: string,
    code: string,
  ): Promise<ParamResponseDto> {
    const param = await this.paramRepo.findOne({
      where: { type, code },
    });

    if (!param) {
      throw new NotFoundException(this.i18n.t('param.get.not_found'));
    }

    return param.toJSON();
  }

  async getByType(type: string): Promise<ParamResponseDto[]> {
    const params = await this.paramRepo.findAll({
      where: { type },
      order: [['code', 'ASC']],
    });

    return params.map((param) => param.toJSON());
  }
}
