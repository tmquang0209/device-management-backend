import { RESPONSE_MSG_KEY } from '@common/enums';
import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ValidationArguments } from 'class-validator';
import { I18nContext } from 'nestjs-i18n';
import { map, Observable } from 'rxjs';

export interface Response<T> {
  data: T;
}

type MessageMeta =
  | string
  | ((ctx?: ExecutionContext) => string)
  | ((a: ValidationArguments) => string)
  | undefined;

@Injectable()
export class TransformationInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  constructor(private readonly reflector: Reflector) {}

  private translateIfPossible(raw: string, ctx: ExecutionContext): string {
    if (!raw) return '';

    const i18n = I18nContext.current(ctx);
    if (!i18n) return raw;

    const pipeIdx = raw.indexOf('|');
    if (pipeIdx > -1) {
      const key = raw.slice(0, pipeIdx).trim();
      const argsStr = raw.slice(pipeIdx + 1).trim();
      try {
        const args = argsStr ? JSON.parse(argsStr) : {};
        return i18n.t(key, { args });
      } catch {
        try {
          return i18n.t(key);
        } catch {
          return raw;
        }
      }
    }

    try {
      return i18n.t(raw);
    } catch {
      return raw;
    }
  }

  private resolveMessage(meta: MessageMeta, ctx: ExecutionContext): string {
    if (!meta) return '';

    if (typeof meta === 'string') {
      return this.translateIfPossible(meta, ctx);
    }

    if (typeof meta === 'function') {
      let result: unknown = '';
      if (meta.length === 0) {
        try {
          result = (meta as () => string)();
        } catch {
          result = '';
        }
      } else {
        try {
          result = (meta as (c?: ExecutionContext) => string)(ctx);
        } catch {
          try {
            result = (meta as (a: ValidationArguments) => string)(
              {} as ValidationArguments,
            );
          } catch {
            result = '';
          }
        }
      }

      return typeof result === 'string'
        ? this.translateIfPossible(result, ctx)
        : '';
    }

    return '';
  }

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const meta = this.reflector.getAllAndOverride<MessageMeta>(
      RESPONSE_MSG_KEY,
      [context.getHandler(), context.getClass()],
    );

    const res = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        const currentStatus = res.statusCode as number;
        if ([200, 201].includes(currentStatus)) {
          res.status(HttpStatus.OK);
        }

        let message = this.resolveMessage(meta, context);

        if (!message) {
          const i18n = I18nContext.current(context);
          message = i18n ? i18n.t('common.http.success') : 'Success';
        }
        let page: number | undefined = undefined;
        let pageSize: number | undefined = undefined;
        let total: number | undefined = undefined;
        if (data && typeof data === 'object') {
          if ('page' in data) page = data.page;
          if ('pageSize' in data) pageSize = data.pageSize;
          if ('total' in data) total = data.total;

          // delete pagination info in data
          delete data.page;
          delete data.pageSize;
          delete data.total;
        }

        const responseData = page !== undefined ? data.data : data;

        return {
          status: currentStatus,
          message,
          data: responseData,
          ...(page !== undefined ? { page } : {}),
          ...(pageSize !== undefined ? { pageSize } : {}),
          ...(total !== undefined ? { total } : {}),
        };
      }),
    );
  }
}
