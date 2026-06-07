# PROMPT_04B: Repository Pattern + JSON:API Response Format

## Status Check

Before executing, verify:
- [ ] `src/products/products.repository.ts` exists with all data access methods
- [ ] `ProductsService` injects `ProductsRepository` (not `@InjectModel` directly)
- [ ] `src/common/serializers/json-api.serializer.ts` exists
- [ ] All GET responses follow JSON:API format (`{ data, meta?, links? }`)
- [ ] GET `/products` supports cursor-based pagination (`?page[size]`, `?page[after]`)
- [ ] GET `/products` and GET `/products/:id` support sparse fieldsets (`?fields[products]=name,price`)
- [ ] Unit tests updated for repository pattern and new response shapes
- [ ] All tests pass with `npm run run-unit-test`

If ALL checks pass → mark as DONE. Otherwise, implement missing parts.

---

## Task

Refactor the Products module to:
1. **Repository Pattern** — extract all Sequelize data access into `ProductsRepository`, service depends only on the repository interface
2. **JSON:API response format** — all responses follow [JSON:API](https://jsonapi.org/) structure
3. **Sparse fieldsets** — allow clients to request specific fields via `?fields[products]=name,price`
4. **Cursor-based pagination** — replace offset pagination with cursor-based (using `id` as cursor)

## Implementation Steps

### 1. Create Products Repository

Create `src/products/products.repository.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Product } from './product.model';
import { CreateProductDto } from './dto';

export interface CursorPaginationOptions {
	size: number;
	after?: number;
	attributes?: string[];
}

export interface CursorPaginatedResult {
	data: Product[];
	hasNext: boolean;
	nextCursor: number | null;
}

@Injectable()
export class ProductsRepository {
	constructor(@InjectModel(Product) private readonly productModel: typeof Product) {}

	async create(dto: CreateProductDto): Promise<Product> {
		return this.productModel.create({ ...dto });
	}

	async findByToken(token: string): Promise<Product | null> {
		return this.productModel.findOne({ where: { productToken: token } });
	}

	async findById(id: number, attributes?: string[]): Promise<Product | null> {
		return this.productModel.findByPk(id, attributes ? { attributes } : undefined);
	}

	async findAll(options: CursorPaginationOptions): Promise<CursorPaginatedResult> {
		const { size, after, attributes } = options;
		const where: Record<string, unknown> = {};
		if (after) {
			const { Op } = await import('sequelize');
			where.id = { [Op.gt]: after };
		}
		const rows = await this.productModel.findAll({
			where,
			order: [['id', 'ASC']],
			limit: size + 1,
			...(attributes ? { attributes } : {})
		});
		const hasNext = rows.length > size;
		const data = hasNext ? rows.slice(0, size) : rows;
		const nextCursor = hasNext ? data[data.length - 1].id : null;
		return { data, hasNext, nextCursor };
	}

	async updateStock(product: Product, stock: number): Promise<Product> {
		product.stock = stock;
		return product.save();
	}

	async remove(product: Product): Promise<void> {
		await product.destroy();
	}
}
```

### 2. Create JSON:API Serializer

Create `src/common/serializers/json-api.serializer.ts`:
```typescript
export interface JsonApiResource {
	type: string;
	id: string;
	attributes: Record<string, unknown>;
}

export interface JsonApiSingleResponse {
	data: JsonApiResource;
}

export interface JsonApiCollectionResponse {
	data: JsonApiResource[];
	meta: { hasNext: boolean };
	links: { next: string | null };
}

export function serializeOne(type: string, id: number, attributes: Record<string, unknown>, fields?: string[]): JsonApiSingleResponse {
	const filtered = fields ? pickFields(attributes, fields) : attributes;
	return { data: { type, id: String(id), attributes: filtered } };
}

export function serializeMany(
	type: string,
	items: { id: number; [key: string]: unknown }[],
	meta: { hasNext: boolean },
	links: { next: string | null },
	fields?: string[]
): JsonApiCollectionResponse {
	const data = items.map((item) => {
		const { id, ...rest } = item;
		const attributes = fields ? pickFields(rest, fields) : rest;
		return { type, id: String(id), attributes };
	});
	return { data, meta, links };
}

function pickFields(obj: Record<string, unknown>, fields: string[]): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const field of fields) {
		if (field in obj) result[field] = obj[field];
	}
	return result;
}
```

Create `src/common/serializers/index.ts`:
```typescript
export { serializeOne, serializeMany, JsonApiSingleResponse, JsonApiCollectionResponse, JsonApiResource } from './json-api.serializer';
```

### 3. Refactor ProductsService

Update `src/products/products.service.ts`:
```typescript
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { CreateProductDto, UpdateStockDto } from './dto';
import { Product } from './product.model';

@Injectable()
export class ProductsService {
	constructor(private readonly productsRepository: ProductsRepository) {}

	async create(dto: CreateProductDto): Promise<Product> {
		const existing = await this.productsRepository.findByToken(dto.productToken);
		if (existing) {
			throw new ConflictException(`Product with token "${dto.productToken}" already exists`);
		}
		return this.productsRepository.create(dto);
	}

	async findAll(size: number, after?: number, attributes?: string[]): Promise<{ data: Product[]; hasNext: boolean; nextCursor: number | null }> {
		return this.productsRepository.findAll({ size, after, attributes });
	}

	async findOne(id: number, attributes?: string[]): Promise<Product> {
		const product = await this.productsRepository.findById(id, attributes);
		if (!product) {
			throw new NotFoundException(`Product with id ${id} not found`);
		}
		return product;
	}

	async updateStock(id: number, dto: UpdateStockDto): Promise<Product> {
		const product = await this.findOne(id);
		return this.productsRepository.updateStock(product, dto.stock);
	}

	async remove(id: number): Promise<void> {
		const product = await this.findOne(id);
		await this.productsRepository.remove(product);
	}
}
```

### 4. Refactor ProductsController

Update `src/products/products.controller.ts`:
```typescript
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateStockDto } from './dto';
import { serializeOne, serializeMany, JsonApiSingleResponse, JsonApiCollectionResponse } from '../common/serializers';

@Controller('products')
export class ProductsController {
	constructor(private readonly productsService: ProductsService) {}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	async create(@Body() dto: CreateProductDto): Promise<JsonApiSingleResponse> {
		const product = await this.productsService.create(dto);
		const { id, ...attributes } = product.toJSON();
		return serializeOne('products', id, attributes);
	}

	@Get()
	async findAll(
		@Query('page[size]', new ParseIntPipe({ optional: true })) size?: number,
		@Query('page[after]', new ParseIntPipe({ optional: true })) after?: number,
		@Query('fields[products]') fields?: string
	): Promise<JsonApiCollectionResponse> {
		const parsedFields = fields ? fields.split(',').map((f) => f.trim()) : undefined;
		const pageSize = size ?? 10;
		const { data, hasNext, nextCursor } = await this.productsService.findAll(pageSize, after, parsedFields);
		const items = data.map((p) => p.toJSON() as { id: number; [key: string]: unknown });
		const nextLink = nextCursor ? `/products?page[size]=${pageSize}&page[after]=${nextCursor}` : null;
		return serializeMany('products', items, { hasNext }, { next: nextLink }, parsedFields);
	}

	@Get(':id')
	async findOne(@Param('id', ParseIntPipe) id: number, @Query('fields[products]') fields?: string): Promise<JsonApiSingleResponse> {
		const parsedFields = fields ? fields.split(',').map((f) => f.trim()) : undefined;
		const product = await this.productsService.findOne(id, parsedFields);
		const { id: productId, ...attributes } = product.toJSON();
		return serializeOne('products', productId, attributes, parsedFields);
	}

	@Patch(':id/stock')
	async updateStock(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStockDto): Promise<JsonApiSingleResponse> {
		const product = await this.productsService.updateStock(id, dto);
		const { id: productId, ...attributes } = product.toJSON();
		return serializeOne('products', productId, attributes);
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
		return this.productsService.remove(id);
	}
}
```

### 5. Update ProductsModule

Update `src/products/products.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Product } from './product.model';
import { ProductsRepository } from './products.repository';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

@Module({
	imports: [SequelizeModule.forFeature([Product])],
	controllers: [ProductsController],
	providers: [ProductsRepository, ProductsService],
	exports: [ProductsService]
})
export class ProductsModule {}
```

### 6. Update Unit Tests

Update `src/products/products.service.spec.ts` to mock `ProductsRepository` instead of the model:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';

describe('ProductsService', () => {
	let service: ProductsService;

	const mockProduct = { id: 1, productToken: 'tok-1', name: 'Widget', price: 9.99, stock: 100, save: jest.fn(), destroy: jest.fn() };

	const mockRepository = {
		create: jest.fn(),
		findByToken: jest.fn(),
		findById: jest.fn(),
		findAll: jest.fn(),
		updateStock: jest.fn(),
		remove: jest.fn()
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [ProductsService, { provide: ProductsRepository, useValue: mockRepository }]
		}).compile();

		service = module.get<ProductsService>(ProductsService);
		jest.clearAllMocks();
	});

	describe('create', () => {
		it('should create a product when token is unique', async () => {
			mockRepository.findByToken.mockResolvedValue(null);
			mockRepository.create.mockResolvedValue(mockProduct);
			const result = await service.create({ name: 'Widget', productToken: 'tok-1', price: 9.99, stock: 100 });
			expect(result).toEqual(mockProduct);
		});

		it('should throw ConflictException when token already exists', async () => {
			mockRepository.findByToken.mockResolvedValue(mockProduct);
			await expect(service.create({ name: 'Widget', productToken: 'tok-1', price: 9.99, stock: 100 })).rejects.toThrow(ConflictException);
		});
	});

	describe('findAll', () => {
		it('should return cursor-paginated results', async () => {
			mockRepository.findAll.mockResolvedValue({ data: [mockProduct], hasNext: false, nextCursor: null });
			const result = await service.findAll(10);
			expect(result).toEqual({ data: [mockProduct], hasNext: false, nextCursor: null });
		});
	});

	describe('findOne', () => {
		it('should return product when found', async () => {
			mockRepository.findById.mockResolvedValue(mockProduct);
			const result = await service.findOne(1);
			expect(result).toEqual(mockProduct);
		});

		it('should throw NotFoundException when product does not exist', async () => {
			mockRepository.findById.mockResolvedValue(null);
			await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
		});
	});

	describe('updateStock', () => {
		it('should delegate to repository updateStock', async () => {
			mockRepository.findById.mockResolvedValue(mockProduct);
			mockRepository.updateStock.mockResolvedValue({ ...mockProduct, stock: 50 });
			const result = await service.updateStock(1, { stock: 50 });
			expect(result.stock).toBe(50);
		});
	});

	describe('remove', () => {
		it('should delegate to repository remove', async () => {
			mockRepository.findById.mockResolvedValue(mockProduct);
			mockRepository.remove.mockResolvedValue(undefined);
			await service.remove(1);
			expect(mockRepository.remove).toHaveBeenCalledWith(mockProduct);
		});
	});
});
```

Update `src/products/products.controller.spec.ts` to validate JSON:API response shape:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
	let controller: ProductsController;

	const mockProduct = { id: 1, productToken: 'tok-1', name: 'Widget', price: 9.99, stock: 100, toJSON: () => ({ id: 1, productToken: 'tok-1', name: 'Widget', price: 9.99, stock: 100 }) };

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
			const sparseProduct = { id: 1, name: 'Widget', price: 9.99, toJSON: () => ({ id: 1, name: 'Widget', price: 9.99 }) };
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
			const updated = { ...mockProduct, stock: 50, toJSON: () => ({ id: 1, productToken: 'tok-1', name: 'Widget', price: 9.99, stock: 50 }) };
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
```

### 7. Add JSON:API Serializer Unit Tests

Create `src/common/serializers/json-api.serializer.spec.ts`:
```typescript
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
			const items = [{ id: 1, name: 'A', price: 1 }, { id: 2, name: 'B', price: 2 }];
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
```

## Validation

```bash
npx tsc --noEmit
npx eslint "src/**/*.ts" --max-warnings=0
npx prettier --check "src/**/*.ts"
npm run run-unit-test
```

## Commit

```bash
git add -A
git commit -m "refactor(products): add repository pattern, JSON:API responses, sparse fieldsets, cursor pagination"
```
