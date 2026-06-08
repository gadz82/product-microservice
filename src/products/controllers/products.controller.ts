import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProductReadService } from '../services/product-read.service';
import { ProductWriteService } from '../services/product-write.service';
import { ProductsSerializer } from '../serializers/products.serializer';
import { CreateProductDto, UpdateStockDto, ProductResponseDto } from '../dto';
import { JsonApiSingleResponse, JsonApiCollectionResponse } from '../../common/serializer';
import { JsonApiSingleResponseSwaggerFor, JsonApiCollectionResponseSwaggerFor } from '../../common/serializer/dto/json-api-response.dto';
import { ParsePaginationTypePipe, PaginationType, PAGINATION_DEFAULTS } from '../../common/pagination';

const ProductSingleResponseSwagger = JsonApiSingleResponseSwaggerFor(ProductResponseDto);
const ProductCollectionResponseSwagger = JsonApiCollectionResponseSwaggerFor(ProductResponseDto);

@ApiTags('products')
@Controller({
	path: 'products',
	version: '1'
})
export class ProductsController {
	constructor(
		private readonly productReadService: ProductReadService,
		private readonly productWriteService: ProductWriteService,
		private readonly serializer: ProductsSerializer
	) {}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create a new product' })
	@ApiBody({ type: CreateProductDto })
	@ApiResponse({ status: HttpStatus.CREATED, description: 'Product created successfully', type: ProductSingleResponseSwagger })
	@ApiResponse({ status: HttpStatus.CONFLICT, description: 'Product with this token already exists' })
	async create(@Body() dto: CreateProductDto): Promise<JsonApiSingleResponse> {
		const product = await this.productWriteService.create(dto);
		return this.serializer.one(product);
	}

	@Get()
	@ApiOperation({ summary: 'Get list of products with pagination' })
	@ApiQuery({ name: 'pt', required: false, enum: ['offset', 'cursor'], description: 'Pagination type' })
	@ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (for offset pagination)' })
	@ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (for offset pagination)' })
	@ApiQuery({ name: 'page[size]', required: false, type: Number, description: 'Page size (for cursor pagination)' })
	@ApiQuery({ name: 'page[after]', required: false, type: String, description: 'Cursor for next page' })
	@ApiResponse({ status: HttpStatus.OK, description: 'List of products retrieved successfully', type: ProductCollectionResponseSwagger })
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
	@ApiOperation({ summary: 'Get a single product by token' })
	@ApiParam({ name: 'productToken', description: 'Unique token identifying the product' })
	@ApiResponse({ status: HttpStatus.OK, description: 'Product found', type: ProductSingleResponseSwagger })
	@ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Product not found' })
	async findOne(@Param('productToken') productToken: string): Promise<JsonApiSingleResponse> {
		const product = await this.productReadService.findOneByToken(productToken);
		return this.serializer.one(product);
	}

	@Patch(':productToken/stock')
	@ApiOperation({ summary: 'Update product stock' })
	@ApiParam({ name: 'productToken', description: 'Unique token identifying the product' })
	@ApiBody({ type: UpdateStockDto })
	@ApiResponse({ status: HttpStatus.OK, description: 'Stock updated successfully', type: ProductSingleResponseSwagger })
	@ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Product not found' })
	async updateStock(@Param('productToken') productToken: string, @Body() dto: UpdateStockDto): Promise<JsonApiSingleResponse> {
		const product = await this.productWriteService.updateStock(productToken, dto);
		return this.serializer.one(product);
	}

	@Delete(':productToken')
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Remove a product' })
	@ApiParam({ name: 'productToken', description: 'Unique token identifying the product' })
	@ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Product removed successfully' })
	@ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Product not found' })
	remove(@Param('productToken') productToken: string): Promise<void> {
		return this.productWriteService.remove(productToken);
	}
}
