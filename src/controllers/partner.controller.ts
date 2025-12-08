import { EndpointKey, ResponseMessage } from '@common/decorators';
import {
  CreatePartnerDto,
  PartnerListRequestDto,
  UpdatePartnerDto,
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
import { PartnerService } from '@services';
import { i18nValidationMessage } from 'nestjs-i18n';

@Controller('partners')
export class PartnerController {
  constructor(private readonly partnerService: PartnerService) {}

  @EndpointKey('partners.create')
  @Post()
  @ResponseMessage(i18nValidationMessage('partner.create.success'))
  createPartner(@Body() dto: CreatePartnerDto) {
    return this.partnerService.create(dto);
  }

  @EndpointKey('partners.get_list')
  @Get()
  @ResponseMessage(i18nValidationMessage('partner.list.success'))
  getListPartners(@Query() params: PartnerListRequestDto) {
    return this.partnerService.getList(params);
  }

  @EndpointKey('partners.get_by_id')
  @Get(':id')
  getPartnerById(@Param('id') id: string) {
    return this.partnerService.getById(id);
  }

  @EndpointKey('partners.update')
  @Put(':id')
  @ResponseMessage(i18nValidationMessage('partner.update.success'))
  updatePartner(@Param('id') id: string, @Body() dto: UpdatePartnerDto) {
    return this.partnerService.update(id, dto);
  }

  @EndpointKey('partners.delete')
  @Delete(':id')
  @ResponseMessage(i18nValidationMessage('partner.delete.success'))
  deletePartner(@Param('id') id: string) {
    return this.partnerService.delete(id);
  }
}
