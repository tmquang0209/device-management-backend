import {
  Audit,
  EndpointKey,
  Permissions,
  ResponseMessage,
} from '@common/decorators';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import {
  BasicInfoDto,
  ChangePasswordDto,
  CreateUserDto,
  UpdateUserDto,
  UserListRequestDto,
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
  Req,
} from '@nestjs/common';
import { UserService } from '@services';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from 'src/generated/i18n.generated';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @EndpointKey('users.info')
  @Get('info')
  @Permissions('users.info')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('user.info.get_profile_success'),
  )
  getUserInfo(@CurrentUser() user: BasicInfoDto) {
    return this.userService.getUserById(user.id);
  }

  @Audit({
    action: 'create',
    resourceType: 'User',
    captureDiff: true,
    includeBody: true,
  })
  @EndpointKey('users.create')
  @Post()
  @Permissions('users.create')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('user.create.success'),
  )
  createUser(@Body() params: CreateUserDto) {
    return this.userService.createUser(params);
  }

  @EndpointKey('users.get_list')
  @Get('get-list')
  @Permissions('users.get_list')
  @ResponseMessage(i18nValidationMessage<I18nTranslations>('user.list.success'))
  getListUsers(@Query() params: UserListRequestDto) {
    return this.userService.getListUsers(params);
  }

  @Audit({
    action: 'update',
    resourceType: 'User',
    captureDiff: true,
    includeBody: true,
    includeParams: true,
  })
  @EndpointKey('users.update')
  @Put(':id')
  @Permissions('users.update')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('user.update.success'),
  )
  updateUser(@Param('id') id: string, @Body() params: UpdateUserDto) {
    return this.userService.updateUser({ ...params, id });
  }

  @Audit({
    action: 'update',
    resourceType: 'User',
    captureDiff: true,
    includeBody: true,
  })
  @EndpointKey('users.update_self')
  @Put()
  @Permissions('users.update_self')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('user.update.success'),
  )
  updateSelfInfo(@Req() req: Request, @Body() params: UpdateUserDto) {
    const { id } = req['user'] as BasicInfoDto;
    return this.userService.updateUser({ ...params, id });
  }

  @EndpointKey('users.change_password')
  @Post('change-password')
  @Permissions('users.change_password')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('user.change_password.success'),
  )
  changePassword(@Body() params: ChangePasswordDto, @Req() req: Request) {
    const { id: userId } = req['user'] as BasicInfoDto;
    return this.userService.changePassword(params, userId);
  }

  @EndpointKey('users.details')
  @Get(':id')
  @Permissions('users.details')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('user.details.success'),
  )
  getDetailUser(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  @Audit({
    action: 'lock',
    resourceType: 'User',
    captureDiff: true,
    includeParams: true,
  })
  @EndpointKey('users.change_status')
  @Delete(':id')
  @Permissions('users.change_status')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('user.change_status.success'),
  )
  lockUser(@Param('id') id: string) {
    return this.userService.lockUser(id);
  }
}
