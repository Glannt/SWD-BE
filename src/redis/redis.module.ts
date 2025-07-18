import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@/config/config.module';
import { ConfigService } from '@/config/config.service';
import { CacheableMemory } from 'cacheable';
import { createClient, createKeyv, Keyv } from '@keyv/redis';
import { RedisService } from './redis.service';
import Redis from 'ioredis';
import Redlock from 'redlock';

@Module({
  imports: [
    ConfigModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const ttl = configService.getCacheTtl();
        const lruSize = configService.getCacheLruSize();
        const redisUrl = configService.getRedisUrl();

        return {
          isGlobal: true,
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
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const redisUserName = configService.getRedisUserName();
        const redisPassword = configService.getRedisPassword();
        const redisPort = configService.getRedisPort();
        const redisHost = configService.getRedisHost();
        const client = createClient({
          username: redisUserName,
          password: redisPassword,
          socket: {
            host: redisHost,
            port: redisPort,
          },
        });
        client.on('error', (err) => console.log('Redis Client Error', err));
        await client.connect();
        return client;
      },
      inject: [ConfigService],
    },
    {
      provide: Redlock,
      useFactory: (redisClient: Redis) => {
        return new Redlock([redisClient], {
          retryCount: 3,
          retryDelay: 200,
        });
      },
      inject: ['REDIS_CLIENT'],
    },
    RedisService,
  ],
  exports: [CacheModule, RedisService],
})
export class NestRedisModule {}
