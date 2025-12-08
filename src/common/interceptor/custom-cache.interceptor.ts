import { SKIP_CACHE_KEY } from '@common/enums';
import {
  CacheInterceptor as BaseCacheInterceptor,
  CACHE_MANAGER,
} from '@nestjs/cache-manager';
import { ExecutionContext, Inject, Injectable, Logger } from '@nestjs/common';
import { HttpAdapterHost, Reflector } from '@nestjs/core';
import { Cache } from 'cache-manager';

@Injectable()
export class CustomCacheInterceptor extends BaseCacheInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    protected readonly reflector: Reflector,
    protected readonly httpAdapterHost: HttpAdapterHost,
  ) {
    super(cacheManager, reflector);
  }

  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    const { httpAdapter } = this.httpAdapterHost;
    const isSkipCache = this.reflector.get<boolean>(
      SKIP_CACHE_KEY,
      context.getHandler(),
    );
    if (isSkipCache) {
      Logger.log('Skipping cache for this request');
      return undefined;
    }
    const requestMethod = httpAdapter.getRequestMethod(request);
    if (requestMethod !== 'GET' && requestMethod !== 'HEAD') {
      return undefined;
    }

    const path = httpAdapter.getRequestUrl(request).split('?')[0];

    const query = request.query || {};
    const sortedQuery = Object.keys(query as object)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => `${key}=${query[key]}`)
      .join('&');

    const normalizedQuery = sortedQuery ? `?${sortedQuery}` : '';

    const logger = new Logger(CustomCacheInterceptor.name);

    logger.log(
      `Cache key: ${process.env.CACHE_PREFIX ?? 'system'}:cache:${requestMethod}:${path}${normalizedQuery}`,
    );

    return `${process.env.CACHE_PREFIX ?? 'system'}:cache:${requestMethod}:${path}${normalizedQuery}`;
  }
}
