import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './product.model';

describe('ProductsService', () => {
	let service: ProductsService;

	const mockProduct = { id: 1, productToken: 'tok-1', name: 'Widget', price: 9.99, stock: 100, save: jest.fn(), destroy: jest.fn() };

	const mockModel = {
		create: jest.fn(),
		findOne: jest.fn(),
		findByPk: jest.fn(),
		findAndCountAll: jest.fn()
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [ProductsService, { provide: getModelToken(Product), useValue: mockModel }]
		}).compile();

		service = module.get<ProductsService>(ProductsService);
		jest.clearAllMocks();
	});

	describe('create', () => {
		it('should create a product when token is unique', async () => {
			mockModel.findOne.mockResolvedValue(null);
			mockModel.create.mockResolvedValue(mockProduct);
			const result = await service.create({ name: 'Widget', productToken: 'tok-1', price: 9.99, stock: 100 });
			expect(result).toEqual(mockProduct);
		});

		it('should throw ConflictException when token already exists', async () => {
			mockModel.findOne.mockResolvedValue(mockProduct);
			await expect(service.create({ name: 'Widget', productToken: 'tok-1', price: 9.99, stock: 100 })).rejects.toThrow(ConflictException);
		});
	});

	describe('findAll', () => {
		it('should return paginated results', async () => {
			mockModel.findAndCountAll.mockResolvedValue({ rows: [mockProduct], count: 1 });
			const result = await service.findAll(1, 10);
			expect(result).toEqual({ data: [mockProduct], total: 1, page: 1, limit: 10 });
		});
	});

	describe('findOne', () => {
		it('should return product when found', async () => {
			mockModel.findByPk.mockResolvedValue(mockProduct);
			const result = await service.findOne(1);
			expect(result).toEqual(mockProduct);
		});

		it('should throw NotFoundException when product does not exist', async () => {
			mockModel.findByPk.mockResolvedValue(null);
			await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
		});
	});

	describe('updateStock', () => {
		it('should update stock and save', async () => {
			mockModel.findByPk.mockResolvedValue({ ...mockProduct, save: jest.fn().mockResolvedValue({ ...mockProduct, stock: 50 }) });
			const result = await service.updateStock(1, { stock: 50 });
			expect(result.stock).toBe(50);
		});
	});

	describe('remove', () => {
		it('should destroy the product', async () => {
			const destroyMock = jest.fn().mockResolvedValue(undefined);
			mockModel.findByPk.mockResolvedValue({ ...mockProduct, destroy: destroyMock });
			await service.remove(1);
			expect(destroyMock).toHaveBeenCalled();
		});
	});
});
