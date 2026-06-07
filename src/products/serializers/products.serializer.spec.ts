import { Test, TestingModule } from '@nestjs/testing';
import { ProductsSerializer } from './products.serializer';
import { Product } from '../models/product.model';
import { JsonApiSerializer } from '../../common/serializer';

describe('ProductsSerializer', () => {
	let serializer: ProductsSerializer;

	const mockProduct = {
		id: 1,
		productToken: 'tok-1',
		name: 'Widget',
		price: 9.99,
		stock: 100,
		createdAt: new Date('2026-01-01'),
		updatedAt: new Date('2026-01-01'),
		toJSON: () => ({ id: 1, productToken: 'tok-1', name: 'Widget', price: 9.99, stock: 100, createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') })
	} as unknown as Product;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [ProductsSerializer, JsonApiSerializer]
		}).compile();

		serializer = module.get<ProductsSerializer>(ProductsSerializer);
	});

	describe('one', () => {
		it('should serialize a single product in JSON:API format', () => {
			const result = serializer.one(mockProduct);
			expect(result.data.type).toBe('products');
			expect(result.data.id).toBe('tok-1');
			expect(result.data.attributes).toHaveProperty('name', 'Widget');
			expect(result.data.attributes).toHaveProperty('createdAt');
			expect(result.data.attributes).toHaveProperty('updatedAt');
			expect(result.data.attributes).not.toHaveProperty('id');
			expect(result.data.attributes).not.toHaveProperty('productToken');
		});

		it('should serialize correctly even when timestamps are strings (from Redis)', () => {
			const dateStr = '2026-06-08T00:00:00.000Z';
			const plainData = {
				id: 2,
				productToken: 'tok-2',
				name: 'Gadget',
				price: 19.99,
				stock: 50,
				createdAt: dateStr,
				updatedAt: dateStr
			};
			// Simulating build(plainData) behavior
			const builtProduct = {
				...plainData,
				toJSON: () => plainData
			} as unknown as Product;

			const result = serializer.one(builtProduct);
			expect(result.data.attributes.createdAt).toBe(dateStr);
			expect(result.data.attributes.updatedAt).toBe(dateStr);
		});
	});

	describe('many', () => {
		it('should serialize a collection with productToken as ID by default', () => {
			const result = serializer.many([mockProduct], { hasNext: false }, null);
			expect(result.data).toHaveLength(1);
			expect(result.data[0].id).toBe('tok-1');
			expect(result.meta).toEqual({ hasNext: false });
			expect(result.links.next).toBeNull();
		});

		it('should serialize a collection with encoded cursor as ID when pt=cursor', () => {
			const result = serializer.many([mockProduct], { hasNext: false }, null, 'cursor');
			expect(result.data).toHaveLength(1);
			expect(result.data[0].id).toBe('MQ=='); // base64 for '1'
		});
	});

	describe('cursorLink', () => {
		it('should return encoded cursor link when nextCursor exists', () => {
			const link = serializer.cursorLink(10, 5);
			expect(link).toBe('/v1/products?pt=cursor&page[size]=10&page[after]=NQ==');
		});

		it('should return null when no nextCursor', () => {
			expect(serializer.cursorLink(10, null)).toBeNull();
		});
	});

	describe('offsetLink', () => {
		it('should return next page link when hasNext', () => {
			const link = serializer.offsetLink(1, 10, true);
			expect(link).toBe('/v1/products?page=2&limit=10');
		});

		it('should return null when no next page', () => {
			expect(serializer.offsetLink(1, 10, false)).toBeNull();
		});
	});
});
