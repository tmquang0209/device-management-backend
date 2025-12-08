import { EndpointKey, ResponseMessage } from '@common/decorators';
import {
  CreateSupplierDto,
  SupplierListRequestDto,
  UpdateSupplierDto,
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
import { SupplierService } from '@services';
import { i18nValidationMessage } from 'nestjs-i18n';

@Controller('suppliers')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @EndpointKey('suppliers.create')
  @Post()
  @ResponseMessage(i18nValidationMessage('supplier.create.success'))
  createSupplier(@Body() dto: CreateSupplierDto) {
    return this.supplierService.create(dto);
  }

  @EndpointKey('suppliers.get_list')
  @Get()
  @ResponseMessage(i18nValidationMessage('supplier.list.success'))
  getListSuppliers(@Query() params: SupplierListRequestDto) {
    return this.supplierService.getList(params);
  }

  @EndpointKey('suppliers.get_by_id')
  @Get(':id')
  getSupplierById(@Param('id') id: string) {
    return this.supplierService.getById(id);
  }

  @EndpointKey('suppliers.update')
  @Put(':id')
  @ResponseMessage(i18nValidationMessage('supplier.update.success'))
  updateSupplier(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.supplierService.update(id, dto);
  }

  @EndpointKey('suppliers.delete')
  @Delete(':id')
  @ResponseMessage(i18nValidationMessage('supplier.delete.success'))
  deleteSupplier(@Param('id') id: string) {
    return this.supplierService.delete(id);
  }
}
