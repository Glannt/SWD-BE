import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@/config/config.module';
import { ConfigService } from '@/config/config.service';
import { CacheableMemory } from 'cacheable';
import { createKeyv, Keyv } from '@keyv/redis';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const ttl = configService.getCacheTtl();
        const lruSize = configService.getCacheLruSize();
        const redisUrl = configService.getRedisUrl();

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
