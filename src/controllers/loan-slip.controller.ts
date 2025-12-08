import { EndpointKey, ResponseMessage } from '@common/decorators';
import {
  CreateLoanSlipDto,
  LoanSlipListRequestDto,
  ReturnLoanSlipDto,
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
import { LoanSlipService } from '@services';
import { i18nValidationMessage } from 'nestjs-i18n';

@Controller('loan-slips')
export class LoanSlipController {
  constructor(private readonly loanSlipService: LoanSlipService) {}

  @EndpointKey('loan_slips.create')
  @Post()
  @ResponseMessage(i18nValidationMessage('loan_slip.create.success'))
  createLoanSlip(@Body() dto: CreateLoanSlipDto) {
    return this.loanSlipService.create(dto);
  }

  @EndpointKey('loan_slips.get_list')
  @Get()
  @ResponseMessage(i18nValidationMessage('loan_slip.list.success'))
  getListLoanSlips(@Query() params: LoanSlipListRequestDto) {
    return this.loanSlipService.getList(params);
  }

  @EndpointKey('loan_slips.get_by_id')
  @Get(':id')
  getLoanSlipById(@Param('id') id: string) {
    return this.loanSlipService.getById(id);
  }

  @EndpointKey('loan_slips.return_devices')
  @Put(':id/return')
  @ResponseMessage(i18nValidationMessage('loan_slip.return.success'))
  returnDevices(@Param('id') id: string, @Body() dto: ReturnLoanSlipDto) {
    return this.loanSlipService.returnDevices(id, dto);
  }

  @EndpointKey('loan_slips.cancel')
  @Delete(':id/cancel')
  @ResponseMessage(i18nValidationMessage('loan_slip.cancel.success'))
  cancelLoanSlip(@Param('id') id: string) {
    return this.loanSlipService.cancel(id);
  }
}
