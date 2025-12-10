import { EndpointKey, ResponseMessage } from '@common/decorators';
import {
  CreateRackDto,
  RackListRequestDto,
  RackResponseDto,
  UpdateRackDto,
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
import { RackService } from '@services';
import { i18nValidationMessage } from 'nestjs-i18n';

@Controller('racks')
export class RackController {
  constructor(private readonly rackService: RackService) {}

  @EndpointKey('racks.create')
  @Post()
  @ResponseMessage(i18nValidationMessage('rack.create.success'))
  create(@Body() dto: CreateRackDto): Promise<RackResponseDto> {
    return this.rackService.create(dto);
  }

  @EndpointKey('racks.get_list')
  @Get()
  @ResponseMessage(i18nValidationMessage('rack.list.success'))
  getList(@Query() params: RackListRequestDto) {
    return this.rackService.getList(params);
  }

  @EndpointKey('racks.get_by_id')
  @Get(':id')
  @ResponseMessage(i18nValidationMessage('rack.find.success'))
  getById(@Param('id') id: string): Promise<RackResponseDto> {
    return this.rackService.getById(id);
  }

  @EndpointKey('racks.update')
  @Put(':id')
  @ResponseMessage(i18nValidationMessage('rack.update.success'))
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRackDto,
  ): Promise<RackResponseDto> {
    return this.rackService.update(id, dto);
  }

  @EndpointKey('racks.delete')
  @Delete(':id')
  @ResponseMessage(i18nValidationMessage('rack.delete.success'))
  delete(@Param('id') id: string): Promise<void> {
    return this.rackService.delete(id);
  }
}
