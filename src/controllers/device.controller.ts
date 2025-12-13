import { EndpointKey, ResponseMessage, SkipCache } from '@common/decorators';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import {
  AvailableDevicesForLoanRequestDto,
  BasicInfoDto,
  ChangeDeviceStatusDto,
  CreateDeviceDto,
  DeviceListRequestDto,
  DevicesByLocationRequestDto,
  DevicesByTypeRequestDto,
  UnassignedDevicesRequestDto,
  UpdateDeviceDto,
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
import { DeviceService } from '@services';
import { i18nValidationMessage } from 'nestjs-i18n';

@SkipCache()
@Controller('devices')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @EndpointKey('devices.create')
  @Post()
  @ResponseMessage(i18nValidationMessage('device.create.success'))
  createDevice(
    @Body() params: CreateDeviceDto,
    @CurrentUser() user: BasicInfoDto,
  ) {
    return this.deviceService.createDevice(params, user?.id);
  }

  @EndpointKey('devices.get_list')
  @Get()
  @ResponseMessage(i18nValidationMessage('device.list.success'))
  getListDevices(@Query() params: DeviceListRequestDto) {
    return this.deviceService.getListDevices(params);
  }

  @EndpointKey('devices.get_available_for_loan')
  @Get('available-for-loan')
  @ResponseMessage(i18nValidationMessage('device.available_for_loan.success'))
  getAvailableDevicesForLoan(
    @Query() params: AvailableDevicesForLoanRequestDto,
  ) {
    return this.deviceService.getAvailableDevicesForLoan(
      params.deviceTypeId,
      params.quantity ?? 1,
    );
  }

  @EndpointKey('devices.get_by_id')
  @Get(':id')
  getDeviceById(@Param('id') id: string) {
    return this.deviceService.getDeviceById(id);
  }

  @EndpointKey('devices.update')
  @Put(':id')
  @ResponseMessage(i18nValidationMessage('device.update.success'))
  updateDevice(
    @Param('id') id: string,
    @Body() params: UpdateDeviceDto,
    @CurrentUser() user: BasicInfoDto,
  ) {
    return this.deviceService.updateDevice(id, params, user?.id);
  }

  @EndpointKey('devices.change_status')
  @Put(':id/status')
  @ResponseMessage(i18nValidationMessage('device.status.success'))
  changeDeviceStatus(
    @Param('id') id: string,
    @Body() statusData: ChangeDeviceStatusDto,
    @CurrentUser() user: BasicInfoDto,
  ) {
    return this.deviceService.changeDeviceStatus(id, statusData, user?.id);
  }

  @EndpointKey('devices.delete')
  @Delete(':id')
  @ResponseMessage(i18nValidationMessage('device.delete.success'))
  deleteDevice(@Param('id') id: string) {
    return this.deviceService.deleteDevice(id);
  }

  @EndpointKey('devices.get_by_type')
  @Get('by-type/:deviceTypeId')
  @ResponseMessage(i18nValidationMessage('device.by_type.success'))
  getDevicesByType(
    @Param('deviceTypeId') deviceTypeId: string,
    @Query() params: DevicesByTypeRequestDto,
  ) {
    return this.deviceService.getDevicesByType(deviceTypeId, params);
  }

  @EndpointKey('devices.get_by_location')
  @Get('by-location/:deviceLocationId')
  @ResponseMessage(i18nValidationMessage('device.by_location.success'))
  getDevicesByLocation(
    @Param('deviceLocationId') deviceLocationId: string,
    @Query() params: DevicesByLocationRequestDto,
  ) {
    return this.deviceService.getDevicesByLocation(deviceLocationId, params);
  }

  @EndpointKey('devices.get_unassigned')
  @Get('unassigned/list')
  @ResponseMessage(i18nValidationMessage('device.unassigned.success'))
  getUnassignedDevices(@Query() params: UnassignedDevicesRequestDto) {
    return this.deviceService.getUnassignedDevices(params);
  }
}
