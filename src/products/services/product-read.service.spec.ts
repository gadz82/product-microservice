import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductReadService } from './product-read.service';
import { ProductsRepository } from '../repositories/products.repository';
import { encodeCursor } from '../../common/pagination/utils/cursor';
import { RedisLazyCacheService } from '../../common/cache/services/redis-lazy-cache.service';

describe('ProductReadService', () => {
	let service: ProductReadService;

	const mockProduct = { id: 1, productToken: 'tok-1', name: 'Widget', price: 9.99, stock: 100 };

	const mockRepository = {
		findByToken: jest.fn(),
		findAll: jest.fn(),
		findAllOffset: jest.fn()
	};

	const mockCacheService = {
		get: jest.fn(),
		set: jest.fn()
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ProductReadService,
				{ provide: ProductsRepository, useValue: mockRepository },
				{ provide: RedisLazyCacheService, useValue: mockCacheService }
			]
		}).compile();

		service = module.get<ProductReadService>(ProductReadService);
		jest.clearAllMocks();
	});

	describe('list', () => {
		it('should return cached results if available', async () => {
			const cachedResult = { data: [mockProduct], meta: {}, nextCursor: null };
			mockCacheService.get.mockResolvedValue(cachedResult);
			const result = await service.list('ol', 1, 10);
			expect(result).toEqual(cachedResult);
			expect(mockCacheService.get).toHaveBeenCalled();
			expect(mockRepository.findAllOffset).not.toHaveBeenCalled();
		});

		it('should return offset-paginated results for pt=ol and cache them', async () => {
			mockCacheService.get.mockResolvedValue(null);
			mockRepository.findAllOffset.mockResolvedValue({ data: [mockProduct], total: 1, page: 1, limit: 10 });
			const result = await service.list('ol', 1, 10);
			expect(result.meta).toHaveProperty('total', 1);
			expect(mockCacheService.set).toHaveBeenCalled();
		});

		it('should return cursor-paginated results for pt=cursor', async () => {
			mockRepository.findAll.mockResolvedValue({ data: [mockProduct], hasNext: false, nextCursor: null });
			const result = await service.list('cursor', undefined, undefined, 10);
			expect(result.meta).toHaveProperty('hasNext', false);
			expect(result.nextCursor).toBeNull();
		});

		it('should decode base64 cursor', async () => {
			mockRepository.findAll.mockResolvedValue({ data: [], hasNext: false, nextCursor: null });
			await service.list('cursor', undefined, undefined, 10, encodeCursor(5));
			expect(mockRepository.findAll).toHaveBeenCalledWith({ size: 10, after: 5 });
		});

		it('should throw BadRequestException on invalid cursor', async () => {
			await expect(service.list('cursor', undefined, undefined, 10, 'not-valid')).rejects.toThrow(BadRequestException);
		});
	});

	describe('findOneByToken', () => {
		it('should return cached product if available', async () => {
			mockCacheService.get.mockResolvedValue(mockProduct);
			const result = await service.findOneByToken('tok-1');
			expect(result).toEqual(mockProduct);
			expect(mockRepository.findByToken).not.toHaveBeenCalled();
		});

		it('should return product when found and cache it', async () => {
			mockCacheService.get.mockResolvedValue(null);
			mockRepository.findByToken.mockResolvedValue(mockProduct);
			const result = await service.findOneByToken('tok-1');
			expect(result).toEqual(mockProduct);
			expect(mockCacheService.set).toHaveBeenCalled();
		});

		it('should throw NotFoundException when product does not exist', async () => {
			mockRepository.findByToken.mockResolvedValue(null);
			await expect(service.findOneByToken('missing')).rejects.toThrow(NotFoundException);
		});
	});
});
