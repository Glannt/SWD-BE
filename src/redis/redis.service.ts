import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import Redis from 'ioredis';
import Redlock, { Lock } from 'redlock';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly redlock: Redlock,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis, // inject ioredis client
  ) {
    this.redlock = new Redlock([this.redisClient], {
      retryCount: 3,
      retryDelay: 200,
    });
  }

  /**
   * Lấy cache theo key, nếu không có thì lock, fetch DB, set cache và trả về.
   * @param key string
   * @param ttl số giây cache
   * @param fetcher hàm async trả về dữ liệu nếu cache miss
   */
  // async getOrSetCache<T>(
  //   key: string,
  //   ttl: number,
  //   fetcher: () => Promise<any>,
  // ): Promise<T> {
  //   // 1. Thử lấy cache
  //   const cached = await this.cacheManager.get<string>(key);
  //   this.logger.log('Cached', cached);
  //   if (cached) return cached;

  //   // 2. Lock bằng setnx (giản lược, production nên dùng redlock)
  //   const lockKey = `${key}:lock`;
  //   let gotLock = false;
  //   try {
  //     // Một số cache-manager không hỗ trợ ifNotExists, bạn có thể dùng redis client gốc nếu cần chắc chắn
  //     gotLock = await (this.cacheManager as any).set(lockKey, '1', {
  //       ttl: 10,
  //       ifNotExists: true,
  //     });
  //   } catch {
  //     gotLock = false;
  //   }
  //   if (!gotLock) {
  //     // Nếu không lấy được lock, đợi 200ms rồi thử lại (hoặc có thể retry nhiều lần)
  //     await new Promise((r) => setTimeout(r, 200));
  //     const retryCache = await this.cacheManager.get<any>(key);
  //     if (retryCache) return retryCache;
  //     // Nếu vẫn không có, tiếp tục fetch DB (tránh deadlock)
  //   }

  //   // 3. Query DB
  //   const data = await fetcher();
  //   try {
  //     await this.cacheManager.set(key, JSON.stringify(data), ttl); // cache lại
  //   } catch (error) {
  //     this.logger.error('không set được');
  //   }
  //   const getCached = await this.cacheManager.get<string>(key);
  //   this.logger.log('Cache sau khi lưu', getCached);
  //   await this.cacheManager.del(lockKey); // giải phóng lock
  //   return data;
  // }

  async getOrSetCache<T>(
    key: string,
    ttl: number,
    fetcher: () => Promise<T>,
  ): Promise<T> {
    // 1. Thử lấy cache
    const cached = await this.cacheManager.get<T>(key);
    if (cached) {
      this.logger.log(`[CACHE HIT] ${key}`);
      return cached;
    }

    // 2. Lock với Redlock
    const lockKey = `locks:${key}`;
    let lock: Lock | null = null;

    try {
      lock = await this.redlock.acquire([lockKey], 10000); // TTL lock 10s
      this.logger.log(`[LOCK ACQUIRED] ${lockKey}`);
    } catch (err) {
      this.logger.warn(`[LOCK FAILED] ${lockKey}, retrying cache...`);
      await new Promise((r) => setTimeout(r, 300));
      const retryCache = await this.cacheManager.get<string>(key);
      if (retryCache) {
        this.logger.log(`[RETRY CACHE HIT] ${key}`);
        return JSON.parse(retryCache);
      }
      this.logger.warn(`[RETRY FAILED] ${key}, fetching directly...`);
      // return await fetcher();
    }

    try {
      const data = await fetcher();
      await this.cacheManager.set(key, data, ttl);
      this.logger.log(`[CACHE SET] ${key}`);
      return data;
    } catch (error) {
      this.logger.error(`[FETCHER ERROR] ${key}`, error);
      throw error;
    } finally {
      if (lock) {
        try {
          await lock.release();
          this.logger.log(`[LOCK RELEASED] ${lockKey}`);
        } catch (releaseErr) {
          this.logger.warn(`[LOCK RELEASE FAILED] ${lockKey}`, releaseErr);
        }
      }
    }
  }
}
