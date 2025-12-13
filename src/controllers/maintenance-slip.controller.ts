import { EndpointKey, ResponseMessage } from '@common/decorators';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import {
  BasicInfoDto,
  CreateMaintenanceSlipDto,
  MaintenanceSlipListRequestDto,
  UpdateMaintenanceSlipDto,
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
import { MaintenanceSlipService } from '@services';
import { i18nValidationMessage } from 'nestjs-i18n';

@Controller('maintenance-slips')
export class MaintenanceSlipController {
  constructor(
    private readonly maintenanceSlipService: MaintenanceSlipService,
  ) {}

  @EndpointKey('maintenance_slips.create')
  @Post()
  @ResponseMessage(i18nValidationMessage('maintenance_slip.create.success'))
  createMaintenanceSlip(
    @Body() dto: CreateMaintenanceSlipDto,
    @CurrentUser() user: BasicInfoDto,
  ) {
    return this.maintenanceSlipService.create(dto, user?.id);
  }

  @EndpointKey('maintenance_slips.get_list')
  @Get()
  @ResponseMessage(i18nValidationMessage('maintenance_slip.list.success'))
  getListMaintenanceSlips(@Query() params: MaintenanceSlipListRequestDto) {
    return this.maintenanceSlipService.getList(params);
  }

  @EndpointKey('maintenance_slips.get_by_id')
  @Get(':id')
  @ResponseMessage(i18nValidationMessage('maintenance_slip.find.success'))
  getMaintenanceSlipById(@Param('id') id: string) {
    return this.maintenanceSlipService.getById(id);
  }

  @EndpointKey('maintenance_slips.get_by_device')
  @Get('device/:deviceId')
  @ResponseMessage(i18nValidationMessage('maintenance_slip.list.success'))
  getMaintenanceSlipsByDevice(@Param('deviceId') deviceId: string) {
    return this.maintenanceSlipService.findByDevice(deviceId);
  }

  @EndpointKey('maintenance_slips.get_by_partner')
  @Get('partner/:partnerId')
  @ResponseMessage(i18nValidationMessage('maintenance_slip.list.success'))
  getMaintenanceSlipsByPartner(@Param('partnerId') partnerId: string) {
    return this.maintenanceSlipService.findByPartner(partnerId);
  }

  @EndpointKey('maintenance_slips.update')
  @Put(':id')
  @ResponseMessage(i18nValidationMessage('maintenance_slip.update.success'))
  updateMaintenanceSlip(
    @Param('id') id: string,
    @Body() dto: UpdateMaintenanceSlipDto,
    @CurrentUser() user: BasicInfoDto,
  ) {
    return this.maintenanceSlipService.update(id, dto, user?.id);
  }

  @EndpointKey('maintenance_slips.delete')
  @Delete(':id')
  @ResponseMessage(i18nValidationMessage('maintenance_slip.delete.success'))
  deleteMaintenanceSlip(@Param('id') id: string) {
    return this.maintenanceSlipService.delete(id);
  }
}
