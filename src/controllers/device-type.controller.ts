import { EndpointKey, ResponseMessage } from '@common/decorators';
import {
  CreateDeviceTypeDto,
  DeviceTypeListRequestDto,
  UpdateDeviceTypeDto,
} from '@dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { DeviceTypeService } from '@services';
import { i18nValidationMessage } from 'nestjs-i18n';

@Controller('device-types')
export class DeviceTypeController {
  constructor(private readonly deviceTypeService: DeviceTypeService) {}

  @EndpointKey('device_types.create')
  @Post()
  @ResponseMessage(i18nValidationMessage('device.type.create.success'))
  createDeviceType(@Body() params: CreateDeviceTypeDto) {
    return this.deviceTypeService.createDeviceType(params);
  }

  @EndpointKey('device_types.get_list')
  @Get()
  @ResponseMessage(i18nValidationMessage('device.type.list.success'))
  getListDeviceTypes(@Query() params: DeviceTypeListRequestDto) {
    return this.deviceTypeService.getListDeviceTypes(params);
  }

  @EndpointKey('device_types.get_by_id')
  @Get(':id')
  getDeviceTypeById(@Param('id') id: string) {
    return this.deviceTypeService.getDeviceTypeById(id);
  }

  @EndpointKey('device_types.update')
  @Put(':id')
  @ResponseMessage(i18nValidationMessage('device.type.update.success'))
  updateDeviceType(
    @Param('id') id: string,
    @Body() params: UpdateDeviceTypeDto,
  ) {
    return this.deviceTypeService.updateDeviceType(id, params);
  }

  @EndpointKey('device_types.delete')
  @Delete(':id')
  @ResponseMessage(i18nValidationMessage('device.type.delete.success'))
  deleteDeviceType(@Param('id') id: string) {
    return this.deviceTypeService.deleteDeviceType(id);
  }
}
