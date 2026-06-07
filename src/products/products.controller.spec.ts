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
		toJSON: (): Record<string, unknown> => ({ id: 1, productToken: 'tok-1', name: 'Widget', price: 9.99, stock: 100 })
	};

	const mockService = {
		create: jest.fn(),
		findAll: jest.fn(),
		findOne: jest.fn(),
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
		it('should return JSON:API single resource format', async () => {
			mockService.create.mockResolvedValue(mockProduct);
			const result = await controller.create({ name: 'Widget', productToken: 'tok-1', price: 9.99, stock: 100 });
			expect(result.data.type).toBe('products');
			expect(result.data.id).toBe('1');
			expect(result.data.attributes).toHaveProperty('name', 'Widget');
		});
	});

	describe('findAll', () => {
		it('should return JSON:API collection with cursor pagination', async () => {
			mockService.findAll.mockResolvedValue({ data: [mockProduct], hasNext: true, nextCursor: 1 });
			const result = await controller.findAll(10, undefined, undefined);
			expect(result.data).toHaveLength(1);
			expect(result.meta.hasNext).toBe(true);
			expect(result.links.next).toContain('page[after]=1');
		});

		it('should support sparse fieldsets', async () => {
			const sparseProduct = {
				id: 1,
				name: 'Widget',
				price: 9.99,
				toJSON: (): Record<string, unknown> => ({ id: 1, name: 'Widget', price: 9.99 })
			};
			mockService.findAll.mockResolvedValue({ data: [sparseProduct], hasNext: false, nextCursor: null });
			const result = await controller.findAll(10, undefined, 'name,price');
			expect(result.data[0].attributes).toEqual({ name: 'Widget', price: 9.99 });
		});
	});

	describe('findOne', () => {
		it('should return JSON:API single resource format', async () => {
			mockService.findOne.mockResolvedValue(mockProduct);
			const result = await controller.findOne(1, undefined);
			expect(result.data.type).toBe('products');
			expect(result.data.id).toBe('1');
		});
	});

	describe('updateStock', () => {
		it('should return JSON:API single resource format', async () => {
			const updated = {
				...mockProduct,
				stock: 50,
				toJSON: (): Record<string, unknown> => ({ id: 1, productToken: 'tok-1', name: 'Widget', price: 9.99, stock: 50 })
			};
			mockService.updateStock.mockResolvedValue(updated);
			const result = await controller.updateStock(1, { stock: 50 });
			expect(result.data.attributes).toHaveProperty('stock', 50);
		});
	});

	describe('remove', () => {
		it('should call service remove', async () => {
			mockService.remove.mockResolvedValue(undefined);
			await controller.remove(1);
			expect(mockService.remove).toHaveBeenCalledWith(1);
		});
	});
});
