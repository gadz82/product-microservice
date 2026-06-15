import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ProductsRepository } from './products.repository';
import { Product } from '../models/product.model';

describe('ProductsRepository', () => {
	let repository: ProductsRepository;

	const mockProduct = { id: 1, productToken: 'tok-1', name: 'Widget', price: '9.99', stock: 100, save: jest.fn(), destroy: jest.fn() };

	const mockModel = {
		create: jest.fn(),
		findOne: jest.fn(),
		findByPk: jest.fn(),
		findAll: jest.fn(),
		findAndCountAll: jest.fn()
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [ProductsRepository, { provide: getModelToken(Product), useValue: mockModel }]
		}).compile();

		repository = module.get<ProductsRepository>(ProductsRepository);
		jest.clearAllMocks();
	});

	describe('create', () => {
		it('should create and return a product', async () => {
			mockModel.create.mockResolvedValue(mockProduct);
			const result = await repository.create({ name: 'Widget', productToken: 'tok-1', price: '9.99', stock: 100 });
			expect(result).toEqual(mockProduct);
		});
	});

	describe('findByToken', () => {
		it('should find a product by token', async () => {
			mockModel.findOne.mockResolvedValue(mockProduct);
			const result = await repository.findByToken('tok-1');
			expect(result).toEqual(mockProduct);
			expect(mockModel.findOne).toHaveBeenCalledWith({ where: { productToken: 'tok-1' } });
		});

		it('should return null when not found', async () => {
			mockModel.findOne.mockResolvedValue(null);
			const result = await repository.findByToken('missing');
			expect(result).toBeNull();
		});
	});

	describe('findById', () => {
		it('should find a product by id', async () => {
			mockModel.findByPk.mockResolvedValue(mockProduct);
			const result = await repository.findById(1);
			expect(result).toEqual(mockProduct);
		});
	});

	describe('findAll (cursor)', () => {
		it('should return paginated results without cursor', async () => {
			mockModel.findAll.mockResolvedValue([mockProduct]);
			const result = await repository.findAll({ size: 10 });
			expect(result).toEqual({ data: [mockProduct], hasNext: false, nextCursor: null });
		});

		it('should detect hasNext when more results exist', async () => {
			const items = [
				{ ...mockProduct, id: 1 },
				{ ...mockProduct, id: 2 }
			];
			mockModel.findAll.mockResolvedValue(items);
			const result = await repository.findAll({ size: 1 });
			expect(result.hasNext).toBe(true);
			expect(result.nextCursor).toBe(1);
			expect(result.data).toHaveLength(1);
		});

		it('should filter by after cursor', async () => {
			mockModel.findAll.mockResolvedValue([]);
			await repository.findAll({ size: 10, after: 5 });
			expect(mockModel.findAll).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: expect.any(Object) }) }));
		});
	});

	describe('findAllOffset', () => {
		it('should return offset-paginated results', async () => {
			mockModel.findAndCountAll.mockResolvedValue({ rows: [mockProduct], count: 1 });
			const result = await repository.findAllOffset({ page: 1, limit: 10 });
			expect(result).toEqual({ data: [mockProduct], total: 1, page: 1, limit: 10 });
		});

		it('should calculate correct offset', async () => {
			mockModel.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
			await repository.findAllOffset({ page: 3, limit: 5 });
			expect(mockModel.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ offset: 10, limit: 5 }));
		});
	});

	describe('updateStock', () => {
		it('should update stock and save', async () => {
			const product = { ...mockProduct, save: jest.fn().mockResolvedValue({ ...mockProduct, stock: 50 }) };
			const result = await repository.updateStock(product as unknown as Product, 50);
			expect(product.stock).toBe(50);
			expect(product.save).toHaveBeenCalled();
			expect(result.stock).toBe(50);
		});
	});

	describe('remove', () => {
		it('should destroy the product', async () => {
			const product = { ...mockProduct, destroy: jest.fn().mockResolvedValue(undefined) };
			await repository.remove(product as unknown as Product);
			expect(product.destroy).toHaveBeenCalled();
		});
	});

	describe('error propagation', () => {
		it('should propagate error from create', async () => {
			mockModel.create.mockRejectedValue(new Error('DB error'));
			await expect(repository.create({ name: 'Widget', productToken: 'tok-1', price: '9.99', stock: 100 })).rejects.toThrow('DB error');
		});
		it('should propagate error from findByToken', async () => {
			mockModel.findOne.mockRejectedValue(new Error('DB error'));
			await expect(repository.findByToken('tok-1')).rejects.toThrow('DB error');
		});
		it('should propagate error from findById', async () => {
			mockModel.findByPk.mockRejectedValue(new Error('DB error'));
			await expect(repository.findById(1)).rejects.toThrow('DB error');
		});
		it('should propagate error from findAll', async () => {
			mockModel.findAll.mockRejectedValue(new Error('DB error'));
			await expect(repository.findAll({ size: 10 })).rejects.toThrow('DB error');
		});
		it('should propagate error from findAllOffset', async () => {
			mockModel.findAndCountAll.mockRejectedValue(new Error('DB error'));
			await expect(repository.findAllOffset({ page: 1, limit: 10 })).rejects.toThrow('DB error');
		});
		it('should propagate error from updateStock', async () => {
			const product = { ...mockProduct, save: jest.fn().mockRejectedValue(new Error('DB error')) };
			await expect(repository.updateStock(product as unknown as Product, 50)).rejects.toThrow('DB error');
		});
		it('should propagate error from remove', async () => {
			const product = { ...mockProduct, destroy: jest.fn().mockRejectedValue(new Error('DB error')) };
			await expect(repository.remove(product as unknown as Product)).rejects.toThrow('DB error');
		});
	});
});
