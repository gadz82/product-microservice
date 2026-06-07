import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsSerializer } from './products.serializer';
import { CreateProductDto, UpdateStockDto } from './dto';
import { JsonApiSingleResponse, JsonApiCollectionResponse } from '../common/serializers';
import { ParsePaginationTypePipe, PaginationType } from '../common/pipes';
import { PAGINATION_DEFAULTS } from '../common/constants';

@Controller('products')
export class ProductsController {
	constructor(
		private readonly productsService: ProductsService,
		private readonly serializer: ProductsSerializer
	) {}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	async create(@Body() dto: CreateProductDto): Promise<JsonApiSingleResponse> {
		const product = await this.productsService.create(dto);
		return this.serializer.one(product);
	}

	@Get()
	async findAll(
		@Query('pt', ParsePaginationTypePipe) pt: PaginationType,
		@Query('page', new ParseIntPipe({ optional: true })) page?: number,
		@Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
		@Query('page[size]', new ParseIntPipe({ optional: true })) size?: number,
		@Query('page[after]') after?: string
	): Promise<JsonApiCollectionResponse> {
		const result = await this.productsService.list(pt, page, limit, size, after);
		const nextLink =
			pt === PAGINATION_DEFAULTS.CURSOR_TYPE
				? this.serializer.cursorLink(size ?? PAGINATION_DEFAULTS.SIZE, result.nextCursor)
				: this.serializer.offsetLink(result.page!, result.limit!, !!result.meta.hasNext);
		return this.serializer.many(result.data, result.meta, nextLink);
	}

	@Get(':productToken')
	async findOne(@Param('productToken') productToken: string): Promise<JsonApiSingleResponse> {
		const product = await this.productsService.findOneByToken(productToken);
		return this.serializer.one(product);
	}

	@Patch(':productToken/stock')
	async updateStock(@Param('productToken') productToken: string, @Body() dto: UpdateStockDto): Promise<JsonApiSingleResponse> {
		const product = await this.productsService.updateStock(productToken, dto);
		return this.serializer.one(product);
	}

	@Delete(':productToken')
	@HttpCode(HttpStatus.NO_CONTENT)
	remove(@Param('productToken') productToken: string): Promise<void> {
		return this.productsService.remove(productToken);
	}
}
