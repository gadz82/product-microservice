import { Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisLazyCacheService } from './services/redis-lazy-cache.service';

const RedisClientProvider: Provider = {
	provide: Redis,
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
	exports: [Redis, RedisLazyCacheService]
})
export class CacheModule {}
