import { EndpointKey, ResponseMessage } from '@common/decorators';
import {
  CreateWarrantyDto,
  UpdateWarrantyDto,
  WarrantyListRequestDto,
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
import { WarrantyService } from '@services';
import { i18nValidationMessage } from 'nestjs-i18n';

@Controller('warranties')
export class WarrantyController {
  constructor(private readonly warrantyService: WarrantyService) {}

  @EndpointKey('warranties.create')
  @Post()
  @ResponseMessage(i18nValidationMessage('warranty.create.success'))
  createWarranty(@Body() dto: CreateWarrantyDto) {
    return this.warrantyService.createRequest(dto);
  }

  @EndpointKey('warranties.get_list')
  @Get()
  @ResponseMessage(i18nValidationMessage('warranty.list.success'))
  getListWarranties(@Query() params: WarrantyListRequestDto) {
    return this.warrantyService.getList(params);
  }

  @EndpointKey('warranties.get_by_id')
  @Get(':id')
  getWarrantyById(@Param('id') id: string) {
    return this.warrantyService.getById(id);
  }

  @EndpointKey('warranties.update')
  @Put(':id')
  @ResponseMessage(i18nValidationMessage('warranty.update.success'))
  updateWarranty(@Param('id') id: string, @Body() dto: UpdateWarrantyDto) {
    return this.warrantyService.update(id, dto);
  }

  @EndpointKey('warranties.complete')
  @Put(':id/complete')
  @ResponseMessage(i18nValidationMessage('warranty.complete.success'))
  completeWarranty(@Param('id') id: string) {
    return this.warrantyService.completeWarranty(id);
  }

  @EndpointKey('warranties.reject')
  @Put(':id/reject')
  @ResponseMessage(i18nValidationMessage('warranty.reject.success'))
  rejectWarranty(@Param('id') id: string) {
    return this.warrantyService.rejectWarranty(id);
  }

  @EndpointKey('warranties.get_by_device')
  @Get('device/:deviceId')
  @ResponseMessage(i18nValidationMessage('warranty.list.success'))
  getWarrantiesByDevice(@Param('deviceId') deviceId: string) {
    return this.warrantyService.findByDevice(deviceId);
  }

  @EndpointKey('warranties.cancel')
  @Delete(':id/cancel')
  @ResponseMessage(i18nValidationMessage('warranty.cancel.success'))
  cancelWarranty(@Param('id') id: string) {
    return this.warrantyService.cancelWarranty(id);
  }
}
