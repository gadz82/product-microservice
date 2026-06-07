import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { LazyCacheService } from '../interfaces/lazy-cache.service.interface';
import { REDIS_CLIENT } from '../cache.module';

@Injectable()
export class RedisLazyCacheService implements LazyCacheService, OnModuleDestroy {
	private readonly defaultTtl = 60; // 60 seconds

	constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

	async get<T>(key: string): Promise<T | null> {
		const cached = await this.client.get(key);
		if (!cached) return null;
		return JSON.parse(cached) as T;
	}

	async set<T>(key: string, value: T, ttl: number = this.defaultTtl): Promise<void> {
		await this.client.set(key, JSON.stringify(value), 'EX', ttl);
	}

	async del(key: string): Promise<void> {
		await this.client.del(key);
	}

	async delByPrefix(prefix: string): Promise<void> {
		const keys = await this.client.keys(`${prefix}*`);
		if (keys.length > 0) {
			await this.client.del(...keys);
		}
	}

	onModuleDestroy() {
		this.client.disconnect();
	}
}
