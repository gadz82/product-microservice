# PROMPT_04C: Dual Pagination (Offset-Limit + Cursor)

## Status Check

Before executing, verify:
- [ ] GET `/products` accepts `pt` query param (validated: `ol` or `cursor`)
- [ ] Default pagination is offset-limit (`pt=ol`): uses `page` and `limit` params
- [ ] Cursor pagination (`pt=cursor`): uses `page[size]` and `page[after]` params
- [ ] Invalid `pt` value returns 400 Bad Request
- [ ] JSON:API response adapts meta/links based on pagination type
- [ ] Repository supports both pagination strategies
- [ ] Unit tests cover both pagination modes
- [ ] All tests pass with `npm run run-unit-test`

If ALL checks pass → mark as DONE. Otherwise, implement missing parts.

---

## Task

Add a `pt` (pagination_type) query parameter to the list endpoint. Defaults to `ol` (offset-limit). Accepts `cursor` as the only alternative. The parameter must be validated — any other value returns 400.

## Implementation Steps

### 1. Add Offset-Limit Pagination to Repository

Update `src/products/products.repository.ts` — add `findAllOffset` method:
```typescript
export interface OffsetPaginationOptions {
	page: number;
	limit: number;
	attributes?: string[];
}

export interface OffsetPaginatedResult {
	data: Product[];
	total: number;
	page: number;
	limit: number;
}

// Add method to ProductsRepository class:
async findAllOffset(options: OffsetPaginationOptions): Promise<OffsetPaginatedResult> {
	const { page, limit, attributes } = options;
	const offset = (page - 1) * limit;
	const { rows: data, count: total } = await this.productModel.findAndCountAll({
		offset,
		limit,
		order: [['id', 'ASC']],
		...(attributes ? { attributes } : {})
	});
	return { data, total, page, limit };
}
```

### 2. Create Pagination Type Validation Pipe

Create `src/common/pipes/parse-pagination-type.pipe.ts`:
```typescript
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

export type PaginationType = 'ol' | 'cursor';

@Injectable()
export class ParsePaginationTypePipe implements PipeTransform<string | undefined, PaginationType> {
	transform(value: string | undefined): PaginationType {
		if (!value) return 'ol';
		if (value === 'ol' || value === 'cursor') return value;
		throw new BadRequestException(`Invalid pagination type "${value}". Allowed: ol, cursor`);
	}
}
```

Create `src/common/pipes/index.ts`:
```typescript
export { ParsePaginationTypePipe, PaginationType } from './parse-pagination-type.pipe';
```

### 3. Update ProductsService

Update `src/products/products.service.ts` — add `findAllOffset` method:
```typescript
async findAllOffset(page: number, limit: number, attributes?: string[]): Promise<{ data: Product[]; total: number; page: number; limit: number }> {
	return this.productsRepository.findAllOffset({ page, limit, attributes });
}
```

### 4. Update ProductsController

Update `src/products/products.controller.ts` — refactor `findAll` to branch on `pt`:
```typescript
import { ParsePaginationTypePipe, PaginationType } from '../common/pipes';

@Get()
async findAll(
	@Query('pt', ParsePaginationTypePipe) pt: PaginationType,
	@Query('page', new ParseIntPipe({ optional: true })) page?: number,
	@Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
	@Query('page[size]', new ParseIntPipe({ optional: true })) size?: number,
	@Query('page[after]', new ParseIntPipe({ optional: true })) after?: number,
	@Query('fields[products]') fields?: string
): Promise<JsonApiCollectionResponse> {
	const parsedFields = fields ? fields.split(',').map((f) => f.trim()) : undefined;

	if (pt === 'cursor') {
		const pageSize = size ?? 10;
		const { data, hasNext, nextCursor } = await this.productsService.findAll(pageSize, after, parsedFields);
		const items = data.map((p) => p.toJSON() as { id: number; [key: string]: unknown });
		const nextLink = nextCursor ? `/products?pt=cursor&page[size]=${pageSize}&page[after]=${nextCursor}` : null;
		return serializeMany('products', items, { hasNext }, { next: nextLink }, parsedFields);
	}

	const pageNum = page ?? 1;
	const pageLimit = limit ?? 10;
	const { data, total, page: currentPage, limit: currentLimit } = await this.productsService.findAllOffset(pageNum, pageLimit, parsedFields);
	const items = data.map((p) => p.toJSON() as { id: number; [key: string]: unknown });
	const hasNext = currentPage * currentLimit < total;
	const nextLink = hasNext ? `/products?page=${currentPage + 1}&limit=${currentLimit}` : null;
	return serializeMany('products', items, { hasNext, total, page: currentPage, limit: currentLimit }, { next: nextLink }, parsedFields);
}
```

### 5. Update JSON:API Serializer Meta Type

Update `src/common/serializers/json-api.serializer.ts` — make meta generic:
```typescript
export interface JsonApiCollectionResponse {
	data: JsonApiResource[];
	meta: Record<string, unknown>;
	links: { next: string | null };
}
```

### 6. Update Unit Tests

Add tests for:
- `ParsePaginationTypePipe`: returns `ol` by default, accepts `cursor`, throws on invalid
- Controller: test both `pt=ol` and `pt=cursor` branches
- Service: test `findAllOffset` method

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
git commit -m "feat(products): add dual pagination with pt parameter (offset-limit default, cursor opt-in)"
```
