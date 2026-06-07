import { serializeOne, serializeMany } from './json-api.serializer';

describe('JsonApiSerializer', () => {
	describe('serializeOne', () => {
		it('should format a single resource', () => {
			const result = serializeOne('products', 1, { name: 'Widget', price: 9.99 });
			expect(result.data.type).toBe('products');
			expect(result.data.id).toBe('1');
			expect(result.data.attributes).toEqual({ name: 'Widget', price: 9.99 });
		});

		it('should apply sparse fieldsets', () => {
			const result = serializeOne('products', 1, { name: 'Widget', price: 9.99, stock: 10 }, ['name']);
			expect(result.data.attributes).toEqual({ name: 'Widget' });
		});
	});

	describe('serializeMany', () => {
		it('should format a collection with meta and links', () => {
			const items = [
				{ id: 1, name: 'A', price: 1 },
				{ id: 2, name: 'B', price: 2 }
			];
			const result = serializeMany('products', items, { hasNext: true }, { next: '/products?page[after]=2' });
			expect(result.data).toHaveLength(2);
			expect(result.meta.hasNext).toBe(true);
			expect(result.links.next).toBe('/products?page[after]=2');
		});

		it('should apply sparse fieldsets to collection', () => {
			const items = [{ id: 1, name: 'A', price: 1, stock: 5 }];
			const result = serializeMany('products', items, { hasNext: false }, { next: null }, ['name']);
			expect(result.data[0].attributes).toEqual({ name: 'A' });
		});
	});
});
