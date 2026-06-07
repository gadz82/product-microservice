import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
	let controller: ProductsController;

	const mockProduct = {
		id: 1,
		productToken: 'tok-1',
		name: 'Widget',
		price: 9.99,
		stock: 100,
		createdAt: new Date('2026-01-01'),
		updatedAt: new Date('2026-01-01'),
		toJSON: (): Record<string, unknown> => ({
			id: 1,
			productToken: 'tok-1',
			name: 'Widget',
			price: 9.99,
			stock: 100,
			createdAt: new Date('2026-01-01'),
			updatedAt: new Date('2026-01-01')
		})
	};

	const mockService = {
		create: jest.fn(),
		findAll: jest.fn(),
		findAllOffset: jest.fn(),
		findOneByToken: jest.fn(),
		updateStock: jest.fn(),
		remove: jest.fn()
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [ProductsController],
			providers: [{ provide: ProductsService, useValue: mockService }]
		}).compile();

		controller = module.get<ProductsController>(ProductsController);
		jest.clearAllMocks();
	});

	describe('create', () => {
		it('should return JSON:API with productToken as id, no id/productToken in attributes', async () => {
			mockService.create.mockResolvedValue(mockProduct);
			const result = await controller.create({ name: 'Widget', productToken: 'tok-1', price: 9.99, stock: 100 });
			expect(result.data.id).toBe('tok-1');
			expect(result.data.type).toBe('products');
			expect(result.data.attributes).not.toHaveProperty('id');
			expect(result.data.attributes).not.toHaveProperty('productToken');
			expect(result.data.attributes).toHaveProperty('name', 'Widget');
		});
	});

	describe('findAll', () => {
		it('should use offset-limit by default (pt=ol)', async () => {
			mockService.findAllOffset.mockResolvedValue({ data: [mockProduct], total: 1, page: 1, limit: 10 });
			const result = await controller.findAll('ol', 1, 10, undefined, undefined);
			expect(result.data[0].id).toBe('tok-1');
			expect(result.meta).toHaveProperty('total', 1);
		});

		it('should use cursor pagination with base64 cursor', async () => {
			mockService.findAll.mockResolvedValue({ data: [mockProduct], hasNext: true, nextCursor: 1 });
			const result = await controller.findAll('cursor', undefined, undefined, 10, undefined);
			expect(result.meta).toHaveProperty('hasNext', true);
			expect(result.links.next).toContain('page[after]=');
			// cursor should be base64 encoded "1" = "MQ=="
			expect(result.links.next).toContain('MQ==');
		});
	});

	describe('findOne', () => {
		it('should return product by token', async () => {
			mockService.findOneByToken.mockResolvedValue(mockProduct);
			const result = await controller.findOne('tok-1');
			expect(result.data.id).toBe('tok-1');
			expect(result.data.attributes).not.toHaveProperty('id');
		});
	});

	describe('updateStock', () => {
		it('should update stock by token', async () => {
			const updated = { ...mockProduct, stock: 50, toJSON: (): Record<string, unknown> => ({ ...mockProduct.toJSON(), stock: 50 }) };
			mockService.updateStock.mockResolvedValue(updated);
			const result = await controller.updateStock('tok-1', { stock: 50 });
			expect(result.data.attributes).toHaveProperty('stock', 50);
		});
	});

	describe('remove', () => {
		it('should call service remove with token', async () => {
			mockService.remove.mockResolvedValue(undefined);
			await controller.remove('tok-1');
			expect(mockService.remove).toHaveBeenCalledWith('tok-1');
		});
	});
});
