import { EndpointKey, ResponseMessage } from '@common/decorators';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import {
  BasicInfoDto,
  CreateMaintenanceReturnSlipDto,
  MaintenanceReturnSlipListRequestDto,
  UpdateMaintenanceReturnSlipDto,
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
import { MaintenanceReturnSlipService } from '@services';
import { i18nValidationMessage } from 'nestjs-i18n';

@Controller('maintenance-return-slips')
export class MaintenanceReturnSlipController {
  constructor(
    private readonly maintenanceReturnSlipService: MaintenanceReturnSlipService,
  ) {}

  @EndpointKey('maintenance_return_slips.get_status_list')
  @Get('statuses')
  getMaintenanceReturnSlipStatusList() {
    return this.maintenanceReturnSlipService.getMaintenanceReturnSlipStatusList();
  }

  @EndpointKey('maintenance_return_slips.get_detail_status_list')
  @Get('detail-statuses')
  getMaintenanceReturnSlipDetailStatusList() {
    return this.maintenanceReturnSlipService.getMaintenanceReturnSlipDetailStatusList();
  }

  @EndpointKey('maintenance_return_slips.get_available_maintenance_slips')
  @Get('available/maintenance-slips')
  getAvailableMaintenanceSlips() {
    return this.maintenanceReturnSlipService.getAvailableMaintenanceSlips();
  }

  @EndpointKey('maintenance_return_slips.get_available_devices')
  @Get('available/devices/:maintenanceSlipId')
  getAvailableDevicesForReturn(
    @Param('maintenanceSlipId') maintenanceSlipId: string,
  ) {
    return this.maintenanceReturnSlipService.getAvailableDevicesForReturn(
      maintenanceSlipId,
    );
  }

  @EndpointKey('maintenance_return_slips.create')
  @Post()
  @ResponseMessage(
    i18nValidationMessage('maintenance_return_slip.create.success'),
  )
  createMaintenanceReturnSlip(
    @Body() dto: CreateMaintenanceReturnSlipDto,
    @CurrentUser() user: BasicInfoDto,
  ) {
    return this.maintenanceReturnSlipService.create(dto, user?.id);
  }

  @EndpointKey('maintenance_return_slips.get_list')
  @Get()
  @ResponseMessage(
    i18nValidationMessage('maintenance_return_slip.list.success'),
  )
  getListMaintenanceReturnSlips(
    @Query() params: MaintenanceReturnSlipListRequestDto,
  ) {
    return this.maintenanceReturnSlipService.getList(params);
  }

  @EndpointKey('maintenance_return_slips.get_by_id')
  @Get(':id')
  getMaintenanceReturnSlipById(@Param('id') id: string) {
    return this.maintenanceReturnSlipService.getById(id);
  }

  @EndpointKey('maintenance_return_slips.update')
  @Put(':id')
  @ResponseMessage(
    i18nValidationMessage('maintenance_return_slip.update.success'),
  )
  updateMaintenanceReturnSlip(
    @Param('id') id: string,
    @Body() dto: UpdateMaintenanceReturnSlipDto,
    @CurrentUser() user: BasicInfoDto,
  ) {
    return this.maintenanceReturnSlipService.update(id, dto, user?.id);
  }

  @EndpointKey('maintenance_return_slips.cancel')
  @Delete(':id/cancel')
  @ResponseMessage(
    i18nValidationMessage('maintenance_return_slip.cancel.success'),
  )
  cancelMaintenanceReturnSlip(
    @Param('id') id: string,
    @CurrentUser() user: BasicInfoDto,
  ) {
    return this.maintenanceReturnSlipService.cancel(id, user?.id);
  }
}
