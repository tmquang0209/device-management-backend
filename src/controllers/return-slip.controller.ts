import { EndpointKey, ResponseMessage } from '@common/decorators';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import {
  BasicInfoDto,
  CreateReturnSlipDto,
  ReturnSlipListRequestDto,
  UpdateReturnSlipDto,
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
import { ReturnSlipService } from '@services';
import { i18nValidationMessage } from 'nestjs-i18n';

@Controller('return-slips')
export class ReturnSlipController {
  constructor(private readonly returnSlipService: ReturnSlipService) {}

  @EndpointKey('return_slips.get_available_loan_slips')
  @Get('available/loan-slips')
  getAvailableLoanSlips() {
    return this.returnSlipService.getAvailableLoanSlips();
  }

  @EndpointKey('return_slips.get_available_devices')
  @Get('available/devices/:loanSlipId')
  getAvailableDevicesForReturn(@Param('loanSlipId') loanSlipId: string) {
    return this.returnSlipService.getAvailableDevicesForReturn(loanSlipId);
  }

  @EndpointKey('return_slips.create')
  @Post()
  @ResponseMessage(i18nValidationMessage('return_slip.create.success'))
  createReturnSlip(
    @Body() dto: CreateReturnSlipDto,
    @CurrentUser() user: BasicInfoDto,
  ) {
    return this.returnSlipService.create(dto, user?.id);
  }

  @EndpointKey('return_slips.get_list')
  @Get()
  @ResponseMessage(i18nValidationMessage('return_slip.list.success'))
  getListReturnSlips(@Query() params: ReturnSlipListRequestDto) {
    return this.returnSlipService.getList(params);
  }

  @EndpointKey('return_slips.get_by_id')
  @Get(':id')
  getReturnSlipById(@Param('id') id: string) {
    return this.returnSlipService.getById(id);
  }

  @EndpointKey('return_slips.update')
  @Put(':id')
  @ResponseMessage(i18nValidationMessage('return_slip.update.success'))
  updateReturnSlip(
    @Param('id') id: string,
    @Body() dto: UpdateReturnSlipDto,
    @CurrentUser() user: BasicInfoDto,
  ) {
    return this.returnSlipService.update(id, dto, user?.id);
  }

  @EndpointKey('return_slips.cancel')
  @Delete(':id/cancel')
  @ResponseMessage(i18nValidationMessage('return_slip.cancel.success'))
  cancelReturnSlip(@Param('id') id: string, @CurrentUser() user: BasicInfoDto) {
    return this.returnSlipService.cancel(id, user?.id);
  }
}
