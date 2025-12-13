import { EndpointKey, ResponseMessage, SkipCache } from '@common/decorators';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import {
  BasicInfoDto,
  CreateDeviceLocationDto,
  DeviceLocationListRequestDto,
  UpdateDeviceLocationDto,
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
import { DeviceLocationService } from '@services';
import { i18nValidationMessage } from 'nestjs-i18n';

@SkipCache()
@Controller('device-locations')
export class DeviceLocationController {
  constructor(private readonly deviceLocationService: DeviceLocationService) {}

  @EndpointKey('device_locations.create')
  @Post()
  @ResponseMessage(i18nValidationMessage('device.location.create.success'))
  createDeviceLocation(
    @Body() params: CreateDeviceLocationDto,
    @CurrentUser() user: BasicInfoDto,
  ) {
    return this.deviceLocationService.createDeviceLocation(params, user?.id);
  }

  @EndpointKey('device_locations.get_list')
  @Get()
  @ResponseMessage(i18nValidationMessage('device.location.list.success'))
  getListDeviceLocations(@Query() params: DeviceLocationListRequestDto) {
    return this.deviceLocationService.getListDeviceLocations(params);
  }

  @EndpointKey('device_locations.get_by_id')
  @Get(':id')
  getDeviceLocationById(@Param('id') id: string) {
    return this.deviceLocationService.getDeviceLocationById(id);
  }

  @EndpointKey('device_locations.update')
  @Put(':id')
  @ResponseMessage(i18nValidationMessage('device.location.update.success'))
  updateDeviceLocation(
    @Param('id') id: string,
    @Body() params: UpdateDeviceLocationDto,
    @CurrentUser() user: BasicInfoDto,
  ) {
    return this.deviceLocationService.updateDeviceLocation(
      id,
      params,
      user?.id,
    );
  }

  @EndpointKey('device_locations.delete')
  @Delete(':id')
  @ResponseMessage(i18nValidationMessage('device.location.delete.success'))
  deleteDeviceLocation(@Param('id') id: string) {
    return this.deviceLocationService.deleteDeviceLocation(id);
  }
}
