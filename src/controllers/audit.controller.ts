import {
  EndpointKey,
  Permissions,
  ResponseMessage,
  SkipCache,
} from '@common/decorators';
import { AuditLogsListRequestDto } from '@dto/audit-log.dto';
import { Controller, Get, Query } from '@nestjs/common';
import { AuditLogService } from '@services';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from 'src/generated/i18n.generated';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @SkipCache()
  @EndpointKey('audit.get_all')
  @Permissions('audit.get_all')
  @ResponseMessage('audit.get_all.success')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('common.http.success'),
  )
  @Get()
  getAllAudits(@Query() query: AuditLogsListRequestDto) {
    return this.auditLogService.findAll(query);
  }

  @SkipCache()
  @EndpointKey('audit.details')
  @Permissions('audit.details')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('common.http.success'),
  )
  @Get(':id')
  getAuditById(@Query('id') id: string) {
    return this.auditLogService.findById({ id });
  }
}
