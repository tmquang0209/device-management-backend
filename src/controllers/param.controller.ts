import { EndpointKey, ResponseMessage } from '@common/decorators';
import { CreateParamDto, ParamListRequestDto, UpdateParamDto } from '@dto';
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
import { ParamService } from '@services';
import { i18nValidationMessage } from 'nestjs-i18n';

@Controller('params')
export class ParamController {
  constructor(private readonly paramService: ParamService) {}

  @EndpointKey('params.create')
  @Post()
  @ResponseMessage(i18nValidationMessage('param.create.success'))
  createParam(@Body() dto: CreateParamDto) {
    return this.paramService.create(dto);
  }

  @EndpointKey('params.get_list')
  @Get()
  @ResponseMessage(i18nValidationMessage('param.list.success'))
  getListParams(@Query() params: ParamListRequestDto) {
    return this.paramService.getList(params);
  }

  @EndpointKey('params.get_by_id')
  @Get(':id')
  getParamById(@Param('id') id: string) {
    return this.paramService.getById(id);
  }

  @EndpointKey('params.get_by_type')
  @Get('type/:type')
  getParamsByType(@Param('type') type: string) {
    return this.paramService.getByType(type);
  }

  @EndpointKey('params.get_by_type_and_code')
  @Get('type/:type/code/:code')
  getParamByTypeAndCode(
    @Param('type') type: string,
    @Param('code') code: string,
  ) {
    return this.paramService.getByTypeAndCode(type, code);
  }

  @EndpointKey('params.update')
  @Put(':id')
  @ResponseMessage(i18nValidationMessage('param.update.success'))
  updateParam(@Param('id') id: string, @Body() dto: UpdateParamDto) {
    return this.paramService.update(id, dto);
  }

  @EndpointKey('params.delete')
  @Delete(':id')
  @ResponseMessage(i18nValidationMessage('param.delete.success'))
  deleteParam(@Param('id') id: string) {
    return this.paramService.delete(id);
  }
}
