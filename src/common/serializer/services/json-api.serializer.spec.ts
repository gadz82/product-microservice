import { Test, TestingModule } from '@nestjs/testing';
import { JsonApiSerializer } from './json-api.serializer';

describe('JsonApiSerializer', () => {
	let serializer: JsonApiSerializer;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [JsonApiSerializer]
		}).compile();

		serializer = module.get<JsonApiSerializer>(JsonApiSerializer);
	});

	describe('serializeOne', () => {
		it('should format a single resource with string id', () => {
			const result = serializer.serializeOne('products', 'tok-1', { name: 'Widget', price: 9.99 });
			expect(result.data.type).toBe('products');
			expect(result.data.id).toBe('tok-1');
			expect(result.data.attributes).toEqual({ name: 'Widget', price: 9.99 });
		});
	});

	describe('serializeMany', () => {
		it('should format a collection with meta and links', () => {
			const items = [
				{ id: 'tok-1', attributes: { name: 'A', price: 1 } },
				{ id: 'tok-2', attributes: { name: 'B', price: 2 } }
			];
			const result = serializer.serializeMany('products', items, { hasNext: true }, { next: '/products?page[after]=abc' });
			expect(result.data).toHaveLength(2);
			expect(result.data[0].id).toBe('tok-1');
			expect(result.meta.hasNext).toBe(true);
			expect(result.links.next).toBe('/products?page[after]=abc');
		});
	});
});
