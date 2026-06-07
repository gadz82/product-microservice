import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductsSerializer } from './products.serializer';

describe('ProductsController', () => {
	let controller: ProductsController;

	const mockProduct = { id: 1, productToken: 'tok-1', name: 'Widget', price: 9.99, stock: 100 };

	const mockService = {
		create: jest.fn(),
		list: jest.fn(),
		findOneByToken: jest.fn(),
		updateStock: jest.fn(),
		remove: jest.fn()
	};

	const mockSerializer = {
		one: jest.fn(),
		many: jest.fn(),
		cursorLink: jest.fn(),
		offsetLink: jest.fn()
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [ProductsController],
			providers: [
				{ provide: ProductsService, useValue: mockService },
				{ provide: ProductsSerializer, useValue: mockSerializer }
			]
		}).compile();

		controller = module.get<ProductsController>(ProductsController);
		jest.clearAllMocks();
	});

	describe('create', () => {
		it('should delegate to service and serialize', async () => {
			mockService.create.mockResolvedValue(mockProduct);
			mockSerializer.one.mockReturnValue({ data: { type: 'products', id: 'tok-1', attributes: {} } });
			const result = await controller.create({ name: 'Widget', productToken: 'tok-1', price: 9.99, stock: 100 });
			expect(mockService.create).toHaveBeenCalled();
			expect(mockSerializer.one).toHaveBeenCalledWith(mockProduct);
			expect(result.data.id).toBe('tok-1');
		});
	});

	describe('findAll', () => {
		it('should delegate to service.list and serializer.many', async () => {
			const listResult = { data: [mockProduct], meta: { hasNext: false, total: 1, page: 1, limit: 10 }, nextCursor: null, page: 1, limit: 10 };
			mockService.list.mockResolvedValue(listResult);
			mockSerializer.offsetLink.mockReturnValue(null);
			mockSerializer.many.mockReturnValue({ data: [], meta: {}, links: { next: null } });
			await controller.findAll('ol', 1, 10, undefined, undefined);
			expect(mockService.list).toHaveBeenCalledWith('ol', 1, 10, undefined, undefined);
			expect(mockSerializer.many).toHaveBeenCalled();
		});

		it('should use cursorLink when pt=cursor', async () => {
			const listResult = { data: [mockProduct], meta: { hasNext: true }, nextCursor: 1 };
			mockService.list.mockResolvedValue(listResult);
			mockSerializer.cursorLink.mockReturnValue('/products?pt=cursor&page[size]=10&page[after]=MQ==');
			mockSerializer.many.mockReturnValue({ data: [], meta: {}, links: { next: '/products?pt=cursor&page[size]=10&page[after]=MQ==' } });
			await controller.findAll('cursor', undefined, undefined, 10, undefined);
			expect(mockSerializer.cursorLink).toHaveBeenCalledWith(10, 1);
		});
	});

	describe('findOne', () => {
		it('should delegate to service and serialize', async () => {
			mockService.findOneByToken.mockResolvedValue(mockProduct);
			mockSerializer.one.mockReturnValue({ data: { type: 'products', id: 'tok-1', attributes: {} } });
			await controller.findOne('tok-1');
			expect(mockService.findOneByToken).toHaveBeenCalledWith('tok-1');
			expect(mockSerializer.one).toHaveBeenCalledWith(mockProduct);
		});
	});

	describe('updateStock', () => {
		it('should delegate to service and serialize', async () => {
			mockService.updateStock.mockResolvedValue(mockProduct);
			mockSerializer.one.mockReturnValue({ data: { type: 'products', id: 'tok-1', attributes: { stock: 50 } } });
			await controller.updateStock('tok-1', { stock: 50 });
			expect(mockService.updateStock).toHaveBeenCalledWith('tok-1', { stock: 50 });
		});
	});

	describe('remove', () => {
		it('should delegate to service', async () => {
			mockService.remove.mockResolvedValue(undefined);
			await controller.remove('tok-1');
			expect(mockService.remove).toHaveBeenCalledWith('tok-1');
		});
	});
});
