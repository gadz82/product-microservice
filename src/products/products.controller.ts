import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateStockDto } from './dto';

@Controller('products')
export class ProductsController {
	constructor(private readonly productsService: ProductsService) {}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	create(@Body() dto: CreateProductDto): Promise<unknown> {
		return this.productsService.create(dto);
	}

	@Get()
	findAll(
		@Query('page', new ParseIntPipe({ optional: true })) page?: number,
		@Query('limit', new ParseIntPipe({ optional: true })) limit?: number
	): Promise<unknown> {
		return this.productsService.findAll(page ?? 1, limit ?? 10);
	}

	@Get(':id')
	findOne(@Param('id', ParseIntPipe) id: number): Promise<unknown> {
		return this.productsService.findOne(id);
	}

	@Patch(':id/stock')
	updateStock(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStockDto): Promise<unknown> {
		return this.productsService.updateStock(id, dto);
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
		return this.productsService.remove(id);
	}
}
