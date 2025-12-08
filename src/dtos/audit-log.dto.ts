import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from 'src/generated/i18n.generated';
import { PaginationRequestDto, PaginationResponseDto } from './pagination.dto';

export interface CreateAuditLog {
  tenantId?: string | number | null;
  actorType: string; // e.g. 'user' | 'system' | 'service'
  actorId?: string | null;
  actorName?: string | null;
  resourceType: string; // e.g. 'Order' | 'User' | 'Invoice'
  resourceId?: string | null;
  action: string; // e.g. 'create' | 'update' | 'delete' | 'login'
  status: 'success' | 'failure';
  reason?: string | null;
  requestId?: string | null;
  correlationId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  origin?: string | null;
  latencyMs?: number | null;
  diffJson?: any;
  requestSnapshot?: {
    params?: Record<string, any>;
    query?: Record<string, any>;
    body?: Record<string, any>;
    headers?: Record<string, string>;
  } | null;
}

export type AuditMeta = {
  action: string; // required
  resourceType: string; // required (e.g. 'User', 'Order')
  resourceIdParam?: string; // optional: name of route param to use as resourceId
  includeBody?: boolean; // default true
  includeQuery?: boolean; // default true
  includeParams?: boolean; // default true
  captureDiff?: boolean; // if you pass before/after to interceptor (see usage), we'll store diffJson
};

export class AuditLogsInfoDto {
  id!: string;
  tenantId?: string;
  actorType!: string;
  actorId?: string | null;
  actorName?: string | null;
  resourceType!: string;
  resourceId?: string | null;
  action!: string;
  status!: 'success' | 'failure';
  reason?: string | null;
  requestId?: string | null;
  correlationId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  origin?: string | null;
  latencyMs?: number | null;
  diffJson?: any;
  requestSnapshot?: {
    params?: Record<string, any>;
    query?: Record<string, any>;
    body?: Record<string, any>;
    headers?: Record<string, string>;
  } | null;
}

export class AuditLogsListRequestDto extends PaginationRequestDto {
  @IsOptional()
  @IsUUID('4', {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_uuid',
    ),
  })
  declare tenantId?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  declare actorType?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  declare actorId?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  declare actorName?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  declare resourceType?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  declare resourceId?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  declare action?: string;

  @IsOptional()
  @IsIn(['success', 'failure'], {
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  declare status?: 'success' | 'failure';

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  declare requestId?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  declare correlationId?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  declare ip?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'common.validation.must_be_string',
    ),
  })
  declare origin?: string;
}

export class AuditLogsListResponseDto extends PaginationResponseDto<AuditLogsInfoDto> {}
