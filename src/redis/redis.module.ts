import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheableMemory } from 'cacheable';
import { createKeyv, Keyv } from '@keyv/redis';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const ttl = configService.get<number>('CACHE_TTL') ?? 60000;
        const lruSize = configService.get<number>('CACHE_LRU_SIZE') ?? 5000;
        const redisUrl =
          configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379';

        return {
          stores: [
            new Keyv({
              store: new CacheableMemory({ ttl, lruSize }),
            }),
            createKeyv(redisUrl),
          ],
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [CacheModule],
})
export class NestRedisModule {}
