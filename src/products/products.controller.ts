import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateStockDto } from './dto';
import { serializeOne, serializeMany, JsonApiSingleResponse, JsonApiCollectionResponse } from '../common/serializers';
import { ParsePaginationTypePipe, PaginationType } from '../common/pipes';

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
		const result = await this.productsService.findAllOffset(pageNum, pageLimit, parsedFields);
		const items = result.data.map((p) => p.toJSON() as { id: number; [key: string]: unknown });
		const hasNext = result.page * result.limit < result.total;
		const nextLink = hasNext ? `/products?page=${result.page + 1}&limit=${result.limit}` : null;
		return serializeMany(
			'products',
			items,
			{ hasNext, total: result.total, page: result.page, limit: result.limit },
			{ next: nextLink },
			parsedFields
		);
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
