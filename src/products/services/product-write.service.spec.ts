import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProductWriteService } from './product-write.service';
import { ProductsRepository } from '../repositories/products.repository';
import { LoggerService } from '../../common/logger';

describe('ProductWriteService', () => {
	let service: ProductWriteService;

	const mockProduct = { id: 1, productToken: 'tok-1', name: 'Widget', price: 9.99, stock: 100 };

	const mockRepository = {
		create: jest.fn(),
		findByToken: jest.fn(),
		updateStock: jest.fn(),
		remove: jest.fn()
	};

	const mockLogger = {
		log: jest.fn(),
		debug: jest.fn(),
		verbose: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
		fatal: jest.fn()
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ProductWriteService,
				{ provide: ProductsRepository, useValue: mockRepository },
				{ provide: LoggerService, useValue: mockLogger }
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
		});

		it('should throw ConflictException when token already exists', async () => {
			mockRepository.findByToken.mockResolvedValue(mockProduct);
			await expect(service.create({ name: 'Widget', productToken: 'tok-1', price: 9.99, stock: 100 })).rejects.toThrow(ConflictException);
		});

		it('should propagate repository error when create fails', async () => {
			mockRepository.findByToken.mockResolvedValue(null);
			const dbError = new Error('DB error');
			mockRepository.create.mockRejectedValue(dbError);
			await expect(service.create({ name: 'Widget', productToken: 'tok-1', price: 9.99, stock: 100 })).rejects.toThrow(dbError);
		});
	});

	describe('updateStock', () => {
		it('should update stock when product exists', async () => {
			mockRepository.findByToken.mockResolvedValue(mockProduct);
			mockRepository.updateStock.mockResolvedValue({ ...mockProduct, stock: 50 });
			const result = await service.updateStock('tok-1', { stock: 50 });
			expect(result.stock).toBe(50);
			expect(mockRepository.updateStock).toHaveBeenCalledWith(mockProduct, 50);
		});

		it('should throw NotFoundException when product does not exist', async () => {
			mockRepository.findByToken.mockResolvedValue(null);
			await expect(service.updateStock('missing', { stock: 50 })).rejects.toThrow(NotFoundException);
		});

		it('should propagate repository error when updateStock fails', async () => {
			mockRepository.findByToken.mockResolvedValue(mockProduct);
			const dbError = new Error('DB error');
			mockRepository.updateStock.mockRejectedValue(dbError);
			await expect(service.updateStock('tok-1', { stock: 50 })).rejects.toThrow(dbError);
		});
	});

	describe('remove', () => {
		it('should remove product when it exists', async () => {
			mockRepository.findByToken.mockResolvedValue(mockProduct);
			mockRepository.remove.mockResolvedValue(undefined);
			await service.remove('tok-1');
			expect(mockRepository.remove).toHaveBeenCalledWith(mockProduct);
		});

		it('should throw NotFoundException when product does not exist', async () => {
			mockRepository.findByToken.mockResolvedValue(null);
			await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
		});

		it('should propagate repository error when remove fails', async () => {
			mockRepository.findByToken.mockResolvedValue(mockProduct);
			const dbError = new Error('DB error');
			mockRepository.remove.mockRejectedValue(dbError);
			await expect(service.remove('tok-1')).rejects.toThrow(dbError);
		});
	});
});
