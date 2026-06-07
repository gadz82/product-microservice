import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';

describe('ProductsService', () => {
	let service: ProductsService;

	const mockProduct = { id: 1, productToken: 'tok-1', name: 'Widget', price: 9.99, stock: 100 };

	const mockRepository = {
		create: jest.fn(),
		findByToken: jest.fn(),
		findById: jest.fn(),
		findAll: jest.fn(),
		findAllOffset: jest.fn(),
		updateStock: jest.fn(),
		remove: jest.fn()
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [ProductsService, { provide: ProductsRepository, useValue: mockRepository }]
		}).compile();

		service = module.get<ProductsService>(ProductsService);
		jest.clearAllMocks();
	});

	describe('create', () => {
		it('should create a product when token is unique', async () => {
			mockRepository.findByToken.mockResolvedValue(null);
			mockRepository.create.mockResolvedValue(mockProduct);
			const result = await service.create({ name: 'Widget', productToken: 'tok-1', price: 9.99, stock: 100 });
			expect(result).toEqual(mockProduct);
		});

		it('should throw ConflictException when token already exists', async () => {
			mockRepository.findByToken.mockResolvedValue(mockProduct);
			await expect(service.create({ name: 'Widget', productToken: 'tok-1', price: 9.99, stock: 100 })).rejects.toThrow(ConflictException);
		});
	});

	describe('findAll', () => {
		it('should return cursor-paginated results', async () => {
			mockRepository.findAll.mockResolvedValue({ data: [mockProduct], hasNext: false, nextCursor: null });
			const result = await service.findAll(10);
			expect(result).toEqual({ data: [mockProduct], hasNext: false, nextCursor: null });
		});
	});

	describe('findAllOffset', () => {
		it('should return offset-paginated results', async () => {
			mockRepository.findAllOffset.mockResolvedValue({ data: [mockProduct], total: 1, page: 1, limit: 10 });
			const result = await service.findAllOffset(1, 10);
			expect(result).toEqual({ data: [mockProduct], total: 1, page: 1, limit: 10 });
		});
	});

	describe('findOneByToken', () => {
		it('should return product when found', async () => {
			mockRepository.findByToken.mockResolvedValue(mockProduct);
			const result = await service.findOneByToken('tok-1');
			expect(result).toEqual(mockProduct);
		});

		it('should throw NotFoundException when product does not exist', async () => {
			mockRepository.findByToken.mockResolvedValue(null);
			await expect(service.findOneByToken('missing')).rejects.toThrow(NotFoundException);
		});
	});

	describe('updateStock', () => {
		it('should delegate to repository updateStock', async () => {
			mockRepository.findByToken.mockResolvedValue(mockProduct);
			mockRepository.updateStock.mockResolvedValue({ ...mockProduct, stock: 50 });
			const result = await service.updateStock('tok-1', { stock: 50 });
			expect(result.stock).toBe(50);
		});
	});

	describe('remove', () => {
		it('should delegate to repository remove', async () => {
			mockRepository.findByToken.mockResolvedValue(mockProduct);
			mockRepository.remove.mockResolvedValue(undefined);
			await service.remove('tok-1');
			expect(mockRepository.remove).toHaveBeenCalledWith(mockProduct);
		});
	});
});
