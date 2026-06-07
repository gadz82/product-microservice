import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateStockDto, ProductResponseDto } from './dto';
import { serializeOne, serializeMany, JsonApiSingleResponse, JsonApiCollectionResponse } from '../common/serializers';
import { ParsePaginationTypePipe, PaginationType } from '../common/pipes';
import { encodeCursor, decodeCursor } from '../common/utils';

@Controller('products')
export class ProductsController {
	constructor(private readonly productsService: ProductsService) {}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	async create(@Body() dto: CreateProductDto): Promise<JsonApiSingleResponse> {
		const product = await this.productsService.create(dto);
		const attributes = plainToInstance(ProductResponseDto, product.toJSON(), { excludeExtraneousValues: true });
		return serializeOne('products', product.productToken, attributes as unknown as Record<string, unknown>);
	}

	@Get()
	async findAll(
		@Query('pt', ParsePaginationTypePipe) pt: PaginationType,
		@Query('page', new ParseIntPipe({ optional: true })) page?: number,
		@Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
		@Query('page[size]', new ParseIntPipe({ optional: true })) size?: number,
		@Query('page[after]') after?: string
	): Promise<JsonApiCollectionResponse> {
		if (pt === 'cursor') {
			const pageSize = size ?? 10;
			let afterId: number | undefined;
			if (after) {
				try {
					afterId = decodeCursor(after);
				} catch {
					throw new BadRequestException('Invalid cursor');
				}
			}
			const { data, hasNext, nextCursor } = await this.productsService.findAll(pageSize, afterId);
			const items = data.map((p) => ({
				id: p.productToken,
				attributes: plainToInstance(ProductResponseDto, p.toJSON(), { excludeExtraneousValues: true }) as unknown as Record<string, unknown>
			}));
			const nextLink = nextCursor ? `/products?pt=cursor&page[size]=${pageSize}&page[after]=${encodeCursor(nextCursor)}` : null;
			return serializeMany('products', items, { hasNext }, { next: nextLink });
		}

		const pageNum = page ?? 1;
		const pageLimit = limit ?? 10;
		const result = await this.productsService.findAllOffset(pageNum, pageLimit);
		const items = result.data.map((p) => ({
			id: p.productToken,
			attributes: plainToInstance(ProductResponseDto, p.toJSON(), { excludeExtraneousValues: true }) as unknown as Record<string, unknown>
		}));
		const hasNext = result.page * result.limit < result.total;
		const nextLink = hasNext ? `/products?page=${result.page + 1}&limit=${result.limit}` : null;
		return serializeMany('products', items, { hasNext, total: result.total, page: result.page, limit: result.limit }, { next: nextLink });
	}

	@Get(':productToken')
	async findOne(@Param('productToken') productToken: string): Promise<JsonApiSingleResponse> {
		const product = await this.productsService.findOneByToken(productToken);
		const attributes = plainToInstance(ProductResponseDto, product.toJSON(), { excludeExtraneousValues: true });
		return serializeOne('products', product.productToken, attributes as unknown as Record<string, unknown>);
	}

	@Patch(':productToken/stock')
	async updateStock(@Param('productToken') productToken: string, @Body() dto: UpdateStockDto): Promise<JsonApiSingleResponse> {
		const product = await this.productsService.updateStock(productToken, dto);
		const attributes = plainToInstance(ProductResponseDto, product.toJSON(), { excludeExtraneousValues: true });
		return serializeOne('products', product.productToken, attributes as unknown as Record<string, unknown>);
	}

	@Delete(':productToken')
	@HttpCode(HttpStatus.NO_CONTENT)
	remove(@Param('productToken') productToken: string): Promise<void> {
		return this.productsService.remove(productToken);
	}
}
