import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ProductReadService } from '../services/product-read.service';
import { ProductWriteService } from '../services/product-write.service';
import { ProductsSerializer } from '../serializers/products.serializer';
import { CreateProductDto, UpdateStockDto } from '../dto';
import { JsonApiSingleResponse, JsonApiCollectionResponse } from '../../common/serializer';
import { ParsePaginationTypePipe, PaginationType, PAGINATION_DEFAULTS } from '../../common/pagination';

@Controller('products')
export class ProductsController {
	constructor(
		private readonly productReadService: ProductReadService,
		private readonly productWriteService: ProductWriteService,
		private readonly serializer: ProductsSerializer
	) {}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	async create(@Body() dto: CreateProductDto): Promise<JsonApiSingleResponse> {
		const product = await this.productWriteService.create(dto);
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
		const result = await this.productReadService.list(pt, page, limit, size, after);
		const nextLink =
			pt === PAGINATION_DEFAULTS.CURSOR_TYPE
				? this.serializer.cursorLink(size ?? PAGINATION_DEFAULTS.SIZE, result.nextCursor)
				: this.serializer.offsetLink(result.page!, result.limit!, !!result.meta.hasNext);
		return this.serializer.many(result.data, result.meta, nextLink, pt);
	}

	@Get(':productToken')
	async findOne(@Param('productToken') productToken: string): Promise<JsonApiSingleResponse> {
		const product = await this.productReadService.findOneByToken(productToken);
		return this.serializer.one(product);
	}

	@Patch(':productToken/stock')
	async updateStock(@Param('productToken') productToken: string, @Body() dto: UpdateStockDto): Promise<JsonApiSingleResponse> {
		const product = await this.productWriteService.updateStock(productToken, dto);
		return this.serializer.one(product);
	}

	@Delete(':productToken')
	@HttpCode(HttpStatus.NO_CONTENT)
	remove(@Param('productToken') productToken: string): Promise<void> {
		return this.productWriteService.remove(productToken);
	}
}
