// cache.service.ts
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../common/common.module'; // đường dẫn tùy cấu trúc thư mục của bạn

@Injectable()
export class CacheService {
  private readonly prefix = process.env.CACHE_PREFIX || 'system';
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /**
   * Build cache key by convention:
   * {prefix}:{namespace}:{id|query}
   */
  buildKey(
    namespace: string,
    parts: Record<string, any> | string | number = '',
  ): string {
    let suffix = '';

    if (typeof parts === 'string' || typeof parts === 'number') {
      suffix = String(parts);
    } else if (typeof parts === 'object' && parts !== null) {
      // Sort object keys to avoid key mismatch when params change order
      suffix = Object.keys(parts)
        .sort()
        .map((k) => `${k}=${parts[k]}`)
        .join('&');
    }

    return suffix
      ? `${this.prefix}:${namespace}:${suffix}`
      : `${this.prefix}:${namespace}`;
  }

  async get<T>(key: string): Promise<T | undefined> {
    Logger.log(`🔍 Getting cache key=${key} from cache`);
    return this.cacheManager.get<T>(key);
  }

  async set<T>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
    await this.cacheManager.set(key, value, ttlSeconds);
    Logger.log(`✅ Cached key=${key} (ttl=${ttlSeconds}s)`);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
    Logger.log(`🗑️ Deleted cache key=${key}`);
  }

  async clear(): Promise<void> {
    await this.cacheManager.clear();
    Logger.log(`🧹 Cleared all cache keys`);
  }

  async keysByPattern(
    pattern: string,
    useNamespacePrefix = true,
    scanCount = 1000,
  ): Promise<string[]> {
    const match = useNamespacePrefix ? `${this.prefix}:${pattern}` : pattern;

    let cursor = '0';
    const keys: string[] = [];
    do {
      const [nextCursor, batch] = await this.redis.scan(
        cursor,
        'MATCH',
        match,
        'COUNT',
        String(scanCount),
      );
      keys.push(...batch);
      cursor = nextCursor;
    } while (cursor !== '0');

    Logger.log(`🔎 Found ${keys.length} keys matching "${match}"`);
    return keys;
  }

  async delByPattern(
    pattern: string,
    {
      scanCount = 1000,
      logEach = false,
    }: { scanCount?: number; logEach?: boolean } = {},
  ): Promise<number> {
    const match = `${this.prefix}:${pattern}`;
    let cursor = '0';
    let total = 0;

    do {
      const [nextCursor, batch] = await this.redis.scan(
        cursor,
        'MATCH',
        match,
        'COUNT',
        String(scanCount),
      );

      if (batch.length) {
        await Promise.all(
          batch.map(async (k) => {
            await this.cacheManager.del(k);
            if (logEach) Logger.log(`🗑️ delByPattern deleted: ${k}`);
          }),
        );
        total += batch.length;
      }

      cursor = nextCursor;
    } while (cursor !== '0');

    Logger.log(`✅ delByPattern("${pattern}") deleted ${total} keys`);
    return total;
  }
}
