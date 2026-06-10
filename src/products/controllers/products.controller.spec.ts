import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductReadService } from '../services/product-read.service';
import { ProductWriteService } from '../services/product-write.service';
import { ProductsSerializer } from '../serializers/products.serializer';

describe('ProductsController', () => {
	let controller: ProductsController;

	const mockProduct = { id: 1, productToken: 'tok-1', name: 'Widget', price: 9.99, stock: 100 };

	const mockReadService = {
		list: jest.fn(),
		findOneByToken: jest.fn()
	};

	const mockWriteService = {
		create: jest.fn(),
		updateStock: jest.fn(),
		adjustStock: jest.fn(),
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
				{ provide: ProductReadService, useValue: mockReadService },
				{ provide: ProductWriteService, useValue: mockWriteService },
				{ provide: ProductsSerializer, useValue: mockSerializer }
			]
		}).compile();

		controller = module.get<ProductsController>(ProductsController);
		jest.clearAllMocks();
	});

	describe('create', () => {
		it('should delegate to writeService and serialize', async () => {
			mockWriteService.create.mockResolvedValue(mockProduct);
			mockSerializer.one.mockReturnValue({ data: { type: 'products', id: 'tok-1', attributes: {} } });
			const result = await controller.create({ name: 'Widget', productToken: 'tok-1', price: 9.99, stock: 100 });
			expect(mockWriteService.create).toHaveBeenCalled();
			expect(mockSerializer.one).toHaveBeenCalledWith(mockProduct);
			expect(result.data.id).toBe('tok-1');
		});
	});

	describe('findAll', () => {
		it('should delegate to readService.list and serializer.many', async () => {
			const listResult = { data: [mockProduct], meta: { hasNext: false, total: 1, page: 1, limit: 10 }, nextCursor: null, page: 1, limit: 10 };
			mockReadService.list.mockResolvedValue(listResult);
			mockSerializer.offsetLink.mockReturnValue(null);
			mockSerializer.many.mockReturnValue({ data: [], meta: {}, links: { next: null } });
			await controller.findAll('offset', 1, 10, undefined, undefined);
			expect(mockReadService.list).toHaveBeenCalledWith('offset', 1, 10, undefined, undefined);
			expect(mockSerializer.many).toHaveBeenCalled();
		});

		it('should use cursorLink when pt=cursor', async () => {
			const listResult = { data: [mockProduct], meta: { hasNext: true }, nextCursor: 1 };
			mockReadService.list.mockResolvedValue(listResult);
			mockSerializer.cursorLink.mockReturnValue('/v1/products?pt=cursor&page[size]=10&page[after]=MQ==');
			mockSerializer.many.mockReturnValue({ data: [], meta: {}, links: { next: '/v1/products?pt=cursor&page[size]=10&page[after]=MQ==' } });
			await controller.findAll('cursor', undefined, undefined, 10, undefined);
			expect(mockSerializer.cursorLink).toHaveBeenCalledWith(10, 1);
		});

		it('should use PAGINATION_DEFAULTS.SIZE when pt=cursor and size is undefined', async () => {
			const listResult = { data: [mockProduct], meta: { hasNext: false }, nextCursor: null };
			mockReadService.list.mockResolvedValue(listResult);
			mockSerializer.cursorLink.mockReturnValue(null);
			mockSerializer.many.mockReturnValue({ data: [], meta: {}, links: { next: null } });
			await controller.findAll('cursor', undefined, undefined, undefined, undefined);
			expect(mockSerializer.cursorLink).toHaveBeenCalledWith(10, null);
		});
	});

	describe('findOne', () => {
		it('should delegate to readService and serialize', async () => {
			mockReadService.findOneByToken.mockResolvedValue(mockProduct);
			mockSerializer.one.mockReturnValue({ data: { type: 'products', id: 'tok-1', attributes: {} } });
			await controller.findOne('tok-1');
			expect(mockReadService.findOneByToken).toHaveBeenCalledWith('tok-1');
			expect(mockSerializer.one).toHaveBeenCalledWith(mockProduct);
		});
	});

	describe('updateStock', () => {
		it('should delegate to writeService and serialize', async () => {
			mockWriteService.updateStock.mockResolvedValue(mockProduct);
			mockSerializer.one.mockReturnValue({ data: { type: 'products', id: 'tok-1', attributes: { stock: 50 } } });
			await controller.updateStock('tok-1', { stock: 50 });
			expect(mockWriteService.updateStock).toHaveBeenCalledWith('tok-1', { stock: 50 });
		});
	});

	describe('adjustStock', () => {
		it('should delegate to writeService.adjustStock and serialize', async () => {
			const adjustedProduct = { ...mockProduct, stock: 95 };
			mockWriteService.adjustStock.mockResolvedValue(adjustedProduct);
			mockSerializer.one.mockReturnValue({ data: { type: 'products', id: 'tok-1', attributes: { stock: 95 } } });
			await controller.adjustStock('tok-1', { delta: -5 });
			expect(mockWriteService.adjustStock).toHaveBeenCalledWith('tok-1', -5);
			expect(mockSerializer.one).toHaveBeenCalledWith(adjustedProduct);
		});
	});

	describe('remove', () => {
		it('should delegate to writeService', async () => {
			mockWriteService.remove.mockResolvedValue(undefined);
			await controller.remove('tok-1');
			expect(mockWriteService.remove).toHaveBeenCalledWith('tok-1');
		});
	});
});
