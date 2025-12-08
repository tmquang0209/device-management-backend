import { AllowUnauthorized, Audit, ResponseMessage } from '@common/decorators';
import { SkipCache } from '@common/decorators';
import { Controller, Get, Query } from '@nestjs/common';
import { MailProducer } from '@producers';
import { AuditContextService, RoutesExplorer, VersionService } from '@services';
import { I18n, I18nContext, i18nValidationMessage } from 'nestjs-i18n';

@Controller()
@AllowUnauthorized()
export class AppController {
  constructor(
    private readonly routesExplorer: RoutesExplorer,
    private readonly mailProducer: MailProducer,
    private readonly auditContext: AuditContextService,
    private readonly versionService: VersionService,
  ) {}

  @Get()
  @SkipCache()
  @Audit({ action: 'read', resourceType: 'User', captureDiff: true })
  main() {
    const originalData = { foo: 'bar' };
    this.auditContext.setAuditBefore(originalData);

    const getOrigin = this.auditContext.getAuditBefore();
    console.log('Original Data from Context:', getOrigin);

    this.auditContext.setAuditAfter({ foo: 'baz' });

    const modifiedData = this.auditContext.getAuditAfter();
    console.log('Modified Data from Context:', modifiedData);
    return this.versionService.info();
  }

  @Get('routes')
  @Audit({
    action: 'read',
    resourceType: 'Route',
    captureDiff: true,
  })
  getRoutes() {
    return this.routesExplorer.getAllRoutes();
  }

  @SkipCache()
  @Get('send-test-mail')
  async sendMail(@Query('to') to: string) {
    await this.mailProducer.sendMailJob({
      to,
      subject: 'Test Email from NestJS',
      data: { name: 'Test User' },
      template: 'welcome', // Ensure you have a template named 'welcome'
    });
    return { status: 'queued' };
  }

  @SkipCache()
  @Get('/hello')
  @ResponseMessage(i18nValidationMessage('common.welcome'))
  getI18nHello(@I18n() i18n: I18nContext) {
    return i18n.t('common.welcome');
  }

  @SkipCache()
  @Get('/health')
  getHealth() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      ...this.versionService.info(),
    };
  }
}
