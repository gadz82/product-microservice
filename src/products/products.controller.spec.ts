import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
	let controller: ProductsController;

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
		it('should delegate to service and return created product', async () => {
			const dto = { name: 'Widget', productToken: 'tok-1', price: 9.99, stock: 10 };
			mockService.create.mockResolvedValue({ id: 1, ...dto });
			const result = await controller.create(dto);
			expect(result).toEqual({ id: 1, ...dto });
			expect(mockService.create).toHaveBeenCalledWith(dto);
		});
	});

	describe('findAll', () => {
		it('should return paginated products', async () => {
			mockService.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 });
			const result = await controller.findAll(1, 10);
			expect((result as { data: unknown[] }).data).toEqual([]);
		});
	});

	describe('findOne', () => {
		it('should return a single product by id', async () => {
			mockService.findOne.mockResolvedValue({ id: 1, name: 'Widget' });
			const result = await controller.findOne(1);
			expect(result).toEqual({ id: 1, name: 'Widget' });
		});
	});

	describe('updateStock', () => {
		it('should update stock for given product', async () => {
			mockService.updateStock.mockResolvedValue({ id: 1, stock: 50 });
			const result = await controller.updateStock(1, { stock: 50 });
			expect(result).toEqual({ id: 1, stock: 50 });
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
