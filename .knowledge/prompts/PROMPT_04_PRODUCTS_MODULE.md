# PROMPT_04: Products Module

## Status Check

Before executing, verify:
- [ ] `src/products/product.model.ts` exists with Sequelize model matching schema
- [ ] `src/products/dto/create-product.dto.ts` with class-validator decorators
- [ ] `src/products/dto/update-stock.dto.ts` with class-validator decorators
- [ ] `src/products/products.service.ts` implements CRUD operations
- [ ] `src/products/products.controller.ts` with all REST endpoints
- [ ] `src/products/products.module.ts` registers model, service, controller
- [ ] `AppModule` imports `ProductsModule`
- [ ] `class-validator` and `class-transformer` installed
- [ ] Global `ValidationPipe` enabled in `main.ts`
- [ ] Pagination implemented on List endpoint

If ALL checks pass → mark as DONE. Otherwise, implement missing parts.

---

## Task

Implement the Products module with full CRUD: model, DTOs with validation, service, controller with proper HTTP status codes, pagination, and error handling.

## Implementation Steps

### 1. Install Dependencies

```bash
npm install --save-exact class-validator class-transformer
```

### 2. Create Product Model

Create `src/products/product.model.ts`:
```typescript
import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'products', timestamps: true })
export class Product extends Model {
	@Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
	declare id: number;

	@Column({ type: DataType.STRING, allowNull: false, unique: true })
	declare productToken: string;

	@Column({ type: DataType.STRING, allowNull: false })
	declare name: string;

	@Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
	declare price: number;

	@Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
	declare stock: number;
}
```

### 3. Create DTOs

Create `src/products/dto/create-product.dto.ts`:
```typescript
import { IsNotEmpty, IsNumber, IsPositive, IsString, Min } from 'class-validator';

export class CreateProductDto {
	@IsString()
	@IsNotEmpty()
	name: string;

	@IsString()
	@IsNotEmpty()
	productToken: string;

	@IsNumber()
	@IsPositive()
	price: number;

	@IsNumber()
	@Min(0)
	stock: number;
}
```

Create `src/products/dto/update-stock.dto.ts`:
```typescript
import { IsNumber, Min } from 'class-validator';

export class UpdateStockDto {
	@IsNumber()
	@Min(0)
	stock: number;
}
```

Create `src/products/dto/index.ts`:
```typescript
export { CreateProductDto } from './create-product.dto';
export { UpdateStockDto } from './update-stock.dto';
```

### 4. Create Products Service

Create `src/products/products.service.ts`:
```typescript
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Product } from './product.model';
import { CreateProductDto, UpdateStockDto } from './dto';

@Injectable()
export class ProductsService {
	constructor(@InjectModel(Product) private readonly productModel: typeof Product) {}

	async create(dto: CreateProductDto): Promise<Product> {
		const existing = await this.productModel.findOne({ where: { productToken: dto.productToken } });
		if (existing) {
			throw new ConflictException(`Product with token "${dto.productToken}" already exists`);
		}
		return this.productModel.create({ ...dto });
	}

	async findAll(page: number = 1, limit: number = 10): Promise<{ data: Product[]; total: number; page: number; limit: number }> {
		const offset = (page - 1) * limit;
		const { rows: data, count: total } = await this.productModel.findAndCountAll({ offset, limit, order: [['id', 'ASC']] });
		return { data, total, page, limit };
	}

	async findOne(id: number): Promise<Product> {
		const product = await this.productModel.findByPk(id);
		if (!product) {
			throw new NotFoundException(`Product with id ${id} not found`);
		}
		return product;
	}

	async updateStock(id: number, dto: UpdateStockDto): Promise<Product> {
		const product = await this.findOne(id);
		product.stock = dto.stock;
		return product.save();
	}

	async remove(id: number): Promise<void> {
		const product = await this.findOne(id);
		await product.destroy();
	}
}
```

### 5. Create Products Controller

Create `src/products/products.controller.ts`:
```typescript
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateStockDto } from './dto';

@Controller('products')
export class ProductsController {
	constructor(private readonly productsService: ProductsService) {}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	create(@Body() dto: CreateProductDto) {
		return this.productsService.create(dto);
	}

	@Get()
	findAll(@Query('page', new ParseIntPipe({ optional: true })) page?: number, @Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
		return this.productsService.findAll(page ?? 1, limit ?? 10);
	}

	@Get(':id')
	findOne(@Param('id', ParseIntPipe) id: number) {
		return this.productsService.findOne(id);
	}

	@Patch(':id/stock')
	updateStock(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStockDto) {
		return this.productsService.updateStock(id, dto);
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	remove(@Param('id', ParseIntPipe) id: number) {
		return this.productsService.remove(id);
	}
}
```

### 6. Create Products Module

Create `src/products/products.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Product } from './product.model';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

@Module({
	imports: [SequelizeModule.forFeature([Product])],
	controllers: [ProductsController],
	providers: [ProductsService],
	exports: [ProductsService]
})
export class ProductsModule {}
```

### 7. Update AppModule

Add `ProductsModule` to imports in `src/app.module.ts`.

### 8. Enable Global ValidationPipe

Update `src/main.ts`:
```typescript
import { ValidationPipe } from '@nestjs/common';
// ... inside bootstrap():
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
```

## Validation

```bash
npx tsc --noEmit
npx eslint "src/**/*.ts" --max-warnings=0
```

## Commit

```bash
git add -A
git commit -m "feat(products): add Products module with CRUD, DTOs, validation, pagination"
```
