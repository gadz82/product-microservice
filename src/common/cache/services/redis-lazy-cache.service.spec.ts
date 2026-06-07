import { Test, TestingModule } from '@nestjs/testing';
import { RedisLazyCacheService } from './redis-lazy-cache.service';
import { REDIS_CLIENT } from '../cache.module';

describe('RedisLazyCacheService', () => {
	let service: RedisLazyCacheService;
	let redisClient: any;

	const mockRedis = {
		get: jest.fn(),
		set: jest.fn(),
		del: jest.fn(),
		keys: jest.fn(),
		disconnect: jest.fn()
	};

	beforeEach(async () => {
		jest.clearAllMocks();
		const module: TestingModule = await Test.createTestingModule({
			providers: [RedisLazyCacheService, { provide: REDIS_CLIENT, useValue: mockRedis }]
		}).compile();

		service = module.get<RedisLazyCacheService>(RedisLazyCacheService);
		redisClient = mockRedis;
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('get', () => {
		it('should return parsed value when key exists', async () => {
			const mockData = { foo: 'bar' };
			redisClient.get.mockResolvedValue(JSON.stringify(mockData));
			const result = await service.get('some-key');
			expect(result).toEqual(mockData);
			expect(redisClient.get).toHaveBeenCalledWith('some-key');
		});

		it('should return null when key does not exist', async () => {
			redisClient.get.mockResolvedValue(null);
			const result = await service.get('missing-key');
			expect(result).toBeNull();
		});
	});

	describe('set', () => {
		it('should call redis set with JSON string and TTL', async () => {
			const mockData = { foo: 'bar' };
			await service.set('some-key', mockData, 300);
			expect(redisClient.set).toHaveBeenCalledWith('some-key', JSON.stringify(mockData), 'EX', 300);
		});

		it('should use default TTL if not provided', async () => {
			const mockData = { foo: 'bar' };
			await service.set('some-key', mockData);
			expect(redisClient.set).toHaveBeenCalledWith('some-key', JSON.stringify(mockData), 'EX', 60);
		});
	});

	describe('del', () => {
		it('should call redis del', async () => {
			await service.del('some-key');
			expect(redisClient.del).toHaveBeenCalledWith('some-key');
		});
	});

	describe('delByPrefix', () => {
		it('should delete keys matching prefix', async () => {
			redisClient.keys.mockResolvedValue(['prefix:1', 'prefix:2']);
			await service.delByPrefix('prefix:');
			expect(redisClient.keys).toHaveBeenCalledWith('prefix:*');
			expect(redisClient.del).toHaveBeenCalledWith('prefix:1', 'prefix:2');
		});

		it('should do nothing if no keys match prefix', async () => {
			redisClient.keys.mockResolvedValue([]);
			await service.delByPrefix('prefix:');
			expect(redisClient.del).not.toHaveBeenCalled();
		});
	});

	describe('onModuleDestroy', () => {
		it('should disconnect redis client', () => {
			service.onModuleDestroy();
			expect(redisClient.disconnect).toHaveBeenCalled();
		});
	});
});
