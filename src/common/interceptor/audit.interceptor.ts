import { AUDIT_META_KEY } from '@common/enums';
import { jsonDiffPatchInstance } from '@common/utils';
import { AuditMeta } from '@dto';
import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuditLogService } from '@services';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import { catchError, finalize, Observable, tap, throwError } from 'rxjs';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(
    private readonly audit: AuditLogService,
    private readonly reflector: Reflector,
    private readonly cls: ClsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = new Date().getTime();
    const http = context.switchToHttp();
    const req = http.getRequest<
      Request & {
        user?: Record<string, any>;
        ip?: string;
        params?: Record<string, any>;
        query?: Record<string, any>;
        headers?: Record<string, any>;
      }
    >();

    const meta = this.reflector.get<AuditMeta>(
      AUDIT_META_KEY,
      context.getHandler(),
    );
    if (!meta) {
      // No audit metadata on this handler — just pass through
      return next.handle();
    }

    // --- Resolve basics ---
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    const correlationId =
      (req.headers['x-correlation-id'] as string) || requestId;
    const user = req.user;
    const actorType = user?.sub ? 'user' : 'system';
    const actorId = user?.id?.toString?.() ?? null;
    const actorName = user?.fullName ?? null;
    const tenantId = user?.sub ?? 'default';

    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      null;

    const userAgent = (req.headers['user-agent'] as string) || null;
    const origin =
      (req.headers['origin'] as string) ||
      (req.headers['host'] as string) ||
      null;

    const resourceId =
      (meta.resourceIdParam && req.params?.[meta.resourceIdParam]) || null;

    const requestSnapshot = {
      params: meta.includeParams !== false ? req.params || {} : undefined,
      query: meta.includeQuery !== false ? req.query || {} : undefined,
      body: meta.includeBody !== false ? safeBody(req.body) : undefined,
      headers: req.headers as Record<string, string>,
    };
    let status: 'success' | 'failure' = 'success';
    let reason: string | null = null;
    let diffJson: any = undefined;

    return next.handle().pipe(
      tap(() => {
        // Capture audit states after controller execution
        const beforeState = this.cls.get('auditBefore') ?? undefined;
        const afterState = this.cls.get('auditAfter') ?? undefined;

        if (meta.captureDiff && (beforeState || afterState)) {
          diffJson = jsonDiffPatchInstance.diff(beforeState, afterState);
          if (diffJson) {
            this.logger.debug(`Detected diff: ${JSON.stringify(diffJson)}`);
          }
        }
      }),
      catchError((err) => {
        status = 'failure';
        if (err instanceof HttpException) {
          reason = `${err.getStatus()} ${JSON.stringify(
            err.getResponse?.() ?? err.message,
          )}`;
        } else {
          reason = err?.message || 'Unknown error';
        }
        // vẫn rethrow để response về client
        return throwError(() => err);
      }),
      finalize(() => {
        const latencyMs = Date.now() - now;

        void this.audit
          .create({
            tenantId,
            actorType,
            actorId,
            actorName,
            resourceType: meta.resourceType,
            resourceId: resourceId ? String(resourceId) : null,
            action: meta.action,
            status,
            reason,
            requestId,
            correlationId,
            ip,
            userAgent,
            origin,
            latencyMs,
            diffJson,
            requestSnapshot,
          })
          .catch((err) => {
            this.logger.error('Failed to create audit log', err);
          });
      }),
    );
  }
}

function safeBody(body: any) {
  if (!body) return body;
  // Redact common sensitive keys
  const redact = new Set([
    'password',
    'pass',
    'token',
    'access_token',
    'refresh_token',
    'accessToken',
    'refreshToken',
    'authorization',
    'secret',
  ]);
  const clone = Array.isArray(body) ? [...body] : { ...body };
  const keys = Array.isArray(clone)
    ? Object.keys(clone as object)
    : Object.keys(clone as Record<string, unknown>);
  for (const k of keys) {
    if (redact.has(k.toLowerCase())) clone[k] = '***';
  }
  return clone;
}
