import 'reflect-metadata';
import { ApiProperty } from '@nestjs/swagger';
import { JsonApiLinksSwagger, JsonApiSingleResponseSwaggerFor, JsonApiCollectionResponseSwaggerFor } from './json-api-response.dto';

class StubAttributesDto {
	@ApiProperty()
	name!: string;

	@ApiProperty()
	price!: number;
}

function getSwaggerTypeFn(target: object, propertyKey: string): (() => unknown) | undefined {
	const meta = Reflect.getMetadata('swagger/apiModelProperties', target, propertyKey);
	return meta?.type;
}

describe('JsonApiLinksSwagger', () => {
	describe('instance', () => {
		it('should be instantiable and accept next as string', () => {
			const instance = new JsonApiLinksSwagger();
			instance.next = '/v1/products?page=2&limit=10';
			expect(instance.next).toBe('/v1/products?page=2&limit=10');
		});

		it('should accept next as null', () => {
			const instance = new JsonApiLinksSwagger();
			instance.next = null;
			expect(instance.next).toBeNull();
		});
	});
});

describe('JsonApiSingleResponseSwaggerFor', () => {
	describe('factory', () => {
		it('should return a class', () => {
			const Cls = JsonApiSingleResponseSwaggerFor(StubAttributesDto);
			expect(typeof Cls).toBe('function');
		});

		it('should assign a unique name based on the AttributesDto name', () => {
			const Cls = JsonApiSingleResponseSwaggerFor(StubAttributesDto);
			expect(Cls.name).toBe('StubAttributesDtoSingleResponseSwagger');
		});

		it('should produce distinct classes for different AttributesDtos', () => {
			class AnotherDto {
				@ApiProperty()
				stock!: number;
			}
			const Cls1 = JsonApiSingleResponseSwaggerFor(StubAttributesDto);
			const Cls2 = JsonApiSingleResponseSwaggerFor(AnotherDto);
			expect(Cls1.name).not.toBe(Cls2.name);
			expect(Cls1).not.toBe(Cls2);
		});

		it('should be instantiable and hold a data object with type, id and attributes', () => {
			const Cls = JsonApiSingleResponseSwaggerFor(StubAttributesDto);
			const instance = new Cls();
			const attrs = new StubAttributesDto();
			attrs.name = 'Widget';
			attrs.price = 9.99;
			instance.data = { type: 'products', id: 'widget-1', attributes: attrs };
			expect(instance.data.type).toBe('products');
			expect(instance.data.id).toBe('widget-1');
			expect(instance.data.attributes).toBe(attrs);
		});

		it('should resolve attributes type thunk to AttributesDto', () => {
			const Cls = JsonApiSingleResponseSwaggerFor(StubAttributesDto);
			const ResourceCls = getSwaggerTypeFn(Cls.prototype, 'data')?.() as { prototype: object };
			const typeFn = getSwaggerTypeFn(ResourceCls.prototype, 'attributes');
			expect(typeFn?.()).toBe(StubAttributesDto);
		});

		it('should resolve data type thunk to resource class', () => {
			const Cls = JsonApiSingleResponseSwaggerFor(StubAttributesDto);
			const typeFn = getSwaggerTypeFn(Cls.prototype, 'data');
			expect(typeof typeFn?.()).toBe('function');
		});
	});
});

describe('JsonApiCollectionResponseSwaggerFor', () => {
	describe('factory', () => {
		it('should return a class', () => {
			const Cls = JsonApiCollectionResponseSwaggerFor(StubAttributesDto);
			expect(typeof Cls).toBe('function');
		});

		it('should assign a unique name based on the AttributesDto name', () => {
			const Cls = JsonApiCollectionResponseSwaggerFor(StubAttributesDto);
			expect(Cls.name).toBe('StubAttributesDtoCollectionResponseSwagger');
		});

		it('should produce distinct classes for different AttributesDtos', () => {
			class AnotherDto {
				@ApiProperty()
				stock!: number;
			}
			const Cls1 = JsonApiCollectionResponseSwaggerFor(StubAttributesDto);
			const Cls2 = JsonApiCollectionResponseSwaggerFor(AnotherDto);
			expect(Cls1.name).not.toBe(Cls2.name);
			expect(Cls1).not.toBe(Cls2);
		});

		it('should be instantiable and hold data array, meta and links', () => {
			const Cls = JsonApiCollectionResponseSwaggerFor(StubAttributesDto);
			const instance = new Cls();
			const attrs = new StubAttributesDto();
			attrs.name = 'Widget';
			attrs.price = 9.99;
			instance.data = [{ type: 'products', id: 'widget-1', attributes: attrs }];
			instance.meta = { total: 1, hasNext: false };
			instance.links = new JsonApiLinksSwagger();
			instance.links.next = null;
			expect(instance.data).toHaveLength(1);
			expect(instance.data[0].type).toBe('products');
			expect(instance.data[0].id).toBe('widget-1');
			expect(instance.data[0].attributes).toBe(attrs);
			expect(instance.meta.total).toBe(1);
			expect(instance.links.next).toBeNull();
		});

		it('should resolve attributes type thunk to AttributesDto', () => {
			const Cls = JsonApiCollectionResponseSwaggerFor(StubAttributesDto);
			const dataTypeFn = getSwaggerTypeFn(Cls.prototype, 'data');
			const ResourceCls = (dataTypeFn?.() as unknown[])[0] as { prototype: object };
			const typeFn = getSwaggerTypeFn(ResourceCls.prototype, 'attributes');
			expect(typeFn?.()).toBe(StubAttributesDto);
		});

		it('should resolve data type thunk to array containing resource class', () => {
			const Cls = JsonApiCollectionResponseSwaggerFor(StubAttributesDto);
			const typeFn = getSwaggerTypeFn(Cls.prototype, 'data');
			const result = typeFn?.() as unknown[];
			expect(Array.isArray(result)).toBe(true);
			expect(typeof result[0]).toBe('function');
		});

		it('should resolve links type thunk to JsonApiLinksSwagger', () => {
			const Cls = JsonApiCollectionResponseSwaggerFor(StubAttributesDto);
			const typeFn = getSwaggerTypeFn(Cls.prototype, 'links');
			expect(typeFn?.()).toBe(JsonApiLinksSwagger);
		});

		it('single and collection factories should produce different class names for the same dto', () => {
			const Single = JsonApiSingleResponseSwaggerFor(StubAttributesDto);
			const Collection = JsonApiCollectionResponseSwaggerFor(StubAttributesDto);
			expect(Single.name).not.toBe(Collection.name);
		});
	});
});
