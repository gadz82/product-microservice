import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';
import { encodeCursor } from '../common/utils';

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

	describe('list', () => {
		it('should return offset-paginated results for pt=ol', async () => {
			mockRepository.findAllOffset.mockResolvedValue({ data: [mockProduct], total: 1, page: 1, limit: 10 });
			const result = await service.list('ol', 1, 10);
			expect(result.meta).toHaveProperty('total', 1);
			expect(result.meta).toHaveProperty('page', 1);
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
