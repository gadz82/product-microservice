import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { ProductWriteService } from './product-write.service';
import { ProductReadService } from './product-read.service';
import { ProductsRepository } from '../repositories/products.repository';
import { RedisLazyCacheService } from '../../common/cache';

describe('ProductWriteService', () => {
	let service: ProductWriteService;

	const mockProduct = { id: 1, productToken: 'tok-1', name: 'Widget', price: 9.99, stock: 100 };

	const mockRepository = {
		create: jest.fn(),
		findByToken: jest.fn(),
		updateStock: jest.fn(),
		remove: jest.fn()
	};

	const mockReadService = {
		findOneByToken: jest.fn()
	};

	const mockCacheService = {
		del: jest.fn(),
		delByPrefix: jest.fn()
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ProductWriteService,
				{ provide: ProductReadService, useValue: mockReadService },
				{ provide: ProductsRepository, useValue: mockRepository },
				{ provide: RedisLazyCacheService, useValue: mockCacheService }
			]
		}).compile();

		service = module.get<ProductWriteService>(ProductWriteService);
		jest.clearAllMocks();
	});

	describe('create', () => {
		it('should create a product when token is unique', async () => {
			mockRepository.findByToken.mockResolvedValue(null);
			mockRepository.create.mockResolvedValue(mockProduct);
			const result = await service.create({ name: 'Widget', productToken: 'tok-1', price: 9.99, stock: 100 });
			expect(result).toEqual(mockProduct);
			expect(mockCacheService.delByPrefix).toHaveBeenCalledWith('product:list');
		});

		it('should throw ConflictException when token already exists', async () => {
			mockRepository.findByToken.mockResolvedValue(mockProduct);
			await expect(service.create({ name: 'Widget', productToken: 'tok-1', price: 9.99, stock: 100 })).rejects.toThrow(ConflictException);
		});
	});

	describe('updateStock', () => {
		it('should delegate to repository updateStock and invalidate cache', async () => {
			mockReadService.findOneByToken.mockResolvedValue(mockProduct);
			mockRepository.updateStock.mockResolvedValue({ ...mockProduct, stock: 50 });
			const result = await service.updateStock('tok-1', { stock: 50 });
			expect(result.stock).toBe(50);
			expect(mockCacheService.del).toHaveBeenCalledWith('product:detail:tok-1');
			expect(mockCacheService.delByPrefix).toHaveBeenCalledWith('product:list');
		});
	});

	describe('remove', () => {
		it('should delegate to repository remove and invalidate cache', async () => {
			mockReadService.findOneByToken.mockResolvedValue(mockProduct);
			mockRepository.remove.mockResolvedValue(undefined);
			await service.remove('tok-1');
			expect(mockRepository.remove).toHaveBeenCalledWith(mockProduct);
			expect(mockCacheService.del).toHaveBeenCalledWith('product:detail:tok-1');
			expect(mockCacheService.delByPrefix).toHaveBeenCalledWith('product:list');
		});
	});
});
