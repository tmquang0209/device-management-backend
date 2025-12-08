import { Audit, EndpointKey, ResponseMessage } from '@common/decorators';
import {
  CreateRoleDto,
  RoleListRequestDto,
  UpdateRoleDto,
} from '@dto/role.dto';
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
import { RoleService } from '@services';
import { I18nService, i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from 'src/generated/i18n.generated';

@Controller('roles')
export class RoleController {
  constructor(
    private readonly roleService: RoleService,
    private readonly i18n: I18nService,
  ) {}

  @EndpointKey('roles.list')
  @Get()
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('role.get_roles_list_success'),
  )
  findAll(@Query() data: RoleListRequestDto) {
    return this.roleService.findAll(data);
  }

  @EndpointKey('roles.permissions')
  @Get('permissions')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>(
      'role.get_permissions_list_success',
    ),
  )
  getAllPermissions() {
    return this.roleService.getPermissions();
  }

  @EndpointKey('roles.info')
  @Get(':roleId')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('role.get_role_info_success'),
  )
  findById(@Param('roleId') roleId: string) {
    return this.roleService.findById(roleId);
  }

  @Audit({
    action: 'create',
    resourceType: 'Role',
    includeBody: true,
    captureDiff: true,
  })
  @EndpointKey('roles.create')
  @Post()
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('role.create_role_success'),
  )
  createRole(@Body() params: CreateRoleDto) {
    return this.roleService.create(params);
  }

  @Audit({
    action: 'update',
    resourceType: 'Role',
    includeBody: true,
    captureDiff: true,
  })
  @EndpointKey('roles.update')
  @Put()
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('role.update_role_success'),
  )
  updateRole(
    @Param('roleId') roleId: string,
    @Body() params: Omit<UpdateRoleDto, 'id'>,
  ) {
    return this.roleService.update({ id: roleId, ...params });
  }

  @Audit({
    action: 'delete',
    resourceType: 'Role',
    includeParams: true,
    captureDiff: true,
  })
  @EndpointKey('roles.delete')
  @Delete('/:roleId')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('role.delete_role_success'),
  )
  deleteRole(@Param('roleId') roleId: string) {
    return this.roleService.delete(roleId);
  }
}
