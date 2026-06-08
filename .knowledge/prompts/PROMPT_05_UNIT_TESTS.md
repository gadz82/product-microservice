# PROMPT_05: Unit Tests

## Status Check

Before executing, verify:
- [ ] `jest` and `@nestjs/testing` are installed
- [ ] `jest.config.ts` exists with proper TypeScript configuration
- [ ] `src/products/products.service.spec.ts` exists with BDD-style tests
- [ ] `src/products/products.controller.spec.ts` exists with BDD-style tests
- [ ] `src/config/env.validation.spec.ts` exists testing validation logic
- [ ] Tests use nested `describe` (Class → Method → behavior)
- [ ] All tests pass with `npm run run-unit-test`

If ALL checks pass → mark as DONE. Otherwise, implement missing parts.

---

## Task

Implement unit tests following strict BDD-style naming with nested describe blocks. All business logic must be tested with mocked dependencies.

## Implementation Steps

### 1. Install Dependencies

```bash
npm install --save-dev --save-exact jest @types/jest ts-jest @nestjs/testing
```

### 2. Create Jest Configuration

Create `jest.config.ts`:
```typescript
import type { Config } from 'jest';

const config: Config = {
	moduleFileExtensions: ['js', 'json', 'ts'],
	rootDir: 'src',
	testRegex: '.*\\.spec\\.ts$',
	transform: { '^.+\\.(t|j)s$': 'ts-jest' },
	collectCoverageFrom: ['**/*.(t|j)s', '!**/*.spec.ts', '!**/index.ts', '!main.ts'],
	coverageDirectory: '../coverage',
	testEnvironment: 'node'
};

export default config;
```

### 3. ProductsService Unit Tests

Create `src/products/products.service.spec.ts`:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './product.model';

describe('ProductsService', () => {
	let service: ProductsService;
	let model: typeof Product;

	const mockProduct = { id: 1, productToken: 'tok-1', name: 'Widget', price: 9.99, stock: 100, save: jest.fn(), destroy: jest.fn() };

	const mockModel = {
		create: jest.fn(),
		findOne: jest.fn(),
		findByPk: jest.fn(),
		findAndCountAll: jest.fn()
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [ProductsService, { provide: getModelToken(Product), useValue: mockModel }]
		}).compile();

		service = module.get<ProductsService>(ProductsService);
		model = module.get<typeof Product>(getModelToken(Product));
		jest.clearAllMocks();
	});

	describe('create', () => {
		it('should create a product when token is unique', async () => {
			mockModel.findOne.mockResolvedValue(null);
			mockModel.create.mockResolvedValue(mockProduct);
			const result = await service.create({ name: 'Widget', productToken: 'tok-1', price: 9.99, stock: 100 });
			expect(result).toEqual(mockProduct);
		});

		it('should throw ConflictException when token already exists', async () => {
			mockModel.findOne.mockResolvedValue(mockProduct);
			await expect(service.create({ name: 'Widget', productToken: 'tok-1', price: 9.99, stock: 100 })).rejects.toThrow(ConflictException);
		});
	});

	describe('findAll', () => {
		it('should return paginated results', async () => {
			mockModel.findAndCountAll.mockResolvedValue({ rows: [mockProduct], count: 1 });
			const result = await service.findAll(1, 10);
			expect(result).toEqual({ data: [mockProduct], total: 1, page: 1, limit: 10 });
		});
	});

	describe('findOne', () => {
		it('should return product when found', async () => {
			mockModel.findByPk.mockResolvedValue(mockProduct);
			const result = await service.findOne(1);
			expect(result).toEqual(mockProduct);
		});

		it('should throw NotFoundException when product does not exist', async () => {
			mockModel.findByPk.mockResolvedValue(null);
			await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
		});
	});

	describe('updateStock', () => {
		it('should update stock and save', async () => {
			mockModel.findByPk.mockResolvedValue({ ...mockProduct, save: jest.fn().mockResolvedValue({ ...mockProduct, stock: 50 }) });
			const result = await service.updateStock(1, { stock: 50 });
			expect(result.stock).toBe(50);
		});
	});

	describe('remove', () => {
		it('should destroy the product', async () => {
			const destroyMock = jest.fn().mockResolvedValue(undefined);
			mockModel.findByPk.mockResolvedValue({ ...mockProduct, destroy: destroyMock });
			await service.remove(1);
			expect(destroyMock).toHaveBeenCalled();
		});
	});
});
```

### 4. ProductsController Unit Tests

Create `src/products/products.controller.spec.ts`:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
	let controller: ProductsController;
	let service: ProductsService;

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
		service = module.get<ProductsService>(ProductsService);
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
			expect(result.data).toEqual([]);
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
```

### 5. Environment Validation Tests

Create `src/config/env.validation.spec.ts`:
```typescript
import { validate } from './env.validation';

describe('EnvValidation', () => {
	describe('validate', () => {
		it('should pass with all required env vars', () => {
			const config = { DB_HOST: 'localhost', DB_NAME: 'ecommerce', DB_USER: 'user', DB_PASSWORD: 'pass' };
			expect(() => validate(config)).not.toThrow();
		});

		it('should throw when required vars are missing', () => {
			expect(() => validate({})).toThrow('Environment validation failed');
		});

		it('should coerce PORT to number', () => {
			const config = { PORT: '4000', DB_HOST: 'localhost', DB_NAME: 'db', DB_USER: 'u', DB_PASSWORD: 'p' };
			const result = validate(config);
			expect(result.PORT).toBe(4000);
		});
	});
});
```

### 6. Add Test Script to package.json

```json
{
  "run-unit-test": "jest --coverage"
}
```

## Validation

```bash
npm run run-unit-test
```

All tests should pass with coverage report generated.

## Commit

```bash
git add -A
git commit -m "test(products): add unit tests for service, controller, and config validation"
```
