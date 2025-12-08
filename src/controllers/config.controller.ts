import {
  Audit,
  EndpointKey,
  Permissions,
  ResponseMessage,
  SkipCache,
} from '@common/decorators';
import {
  ConfigListRequestDto,
  CreateConfigDto,
  DeleteBatchConfigsDto,
  UpdateBatchConfigStatusDto,
  UpdateConfigDto,
} from '@dto/config.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@services';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from 'src/generated/i18n.generated';

@Controller('configs')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Audit({ action: 'create', resourceType: 'Config', captureDiff: true })
  @EndpointKey('configs.create')
  @Permissions('configs.create')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('config.create.success'),
  )
  @Post()
  async createConfig(@Body() data: CreateConfigDto) {
    return this.configService.setConfig(data);
  }

  @SkipCache()
  @Audit({ action: 'list', resourceType: 'Config' })
  @EndpointKey('configs.list')
  @Permissions('configs.list')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('config.list.success'),
  )
  @Get()
  async listConfigs(@Query() params: ConfigListRequestDto) {
    return this.configService.getAllConfigs(params);
  }

  @SkipCache()
  @EndpointKey('configs.info')
  @Audit({ action: 'view', resourceType: 'Config', resourceIdParam: 'id' })
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('config.info.success'),
  )
  @Get(':keyword')
  async getConfig(@Param('keyword') keyword: string) {
    return this.configService.getConfigDetails(keyword);
  }

  @Audit({
    action: 'update',
    resourceType: 'Config',
    captureDiff: true,
  })
  @EndpointKey('configs.update')
  @Permissions('configs.update')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('config.update.success'),
  )
  @Put(':id')
  async updateConfig(@Param('id') id: string, @Body() data: UpdateConfigDto) {
    return this.configService.updateConfig({ ...data, id });
  }

  @Delete('delete-batch')
  @Audit({
    action: 'delete',
    resourceType: 'Config',
    captureDiff: true,
  })
  @EndpointKey('configs.delete_batch')
  @Permissions('configs.delete_batch')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('config.delete.success'),
  )
  async deleteMultipleConfigs(@Body() params: DeleteBatchConfigsDto) {
    return this.configService.deleteConfigsBatch(params);
  }

  @EndpointKey('configs.delete')
  @Audit({
    action: 'delete',
    resourceType: 'Config',
    captureDiff: true,
    resourceIdParam: 'id',
  })
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('config.delete.success'),
  )
  @Delete(':id')
  deleteConfig(@Param('id') id: string) {
    return this.configService.deleteConfig(id);
  }

  @Patch('batch/status')
  @Audit({
    action: 'update',
    resourceType: 'Config',
    captureDiff: true,
  })
  @EndpointKey('configs.update_batch_status')
  @Permissions('configs.update_batch_status')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('config.update.success'),
  )
  async updateMultipleConfigs(@Body() configs: UpdateBatchConfigStatusDto) {
    return this.configService.updateConfigsBatch(configs);
  }
}
