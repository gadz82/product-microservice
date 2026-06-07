import { Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisLazyCacheService } from './services/redis-lazy-cache.service';

export const REDIS_CLIENT = 'REDIS_CLIENT';

const RedisClientProvider: Provider = {
	provide: REDIS_CLIENT,
	useFactory: (configService: ConfigService) => {
		return new Redis({
			host: configService.get<string>('redis.host'),
			port: configService.get<number>('redis.port')
		});
	},
	inject: [ConfigService]
};

@Module({
	providers: [RedisClientProvider, RedisLazyCacheService],
	exports: [REDIS_CLIENT, RedisLazyCacheService]
})
export class CacheModule {}
