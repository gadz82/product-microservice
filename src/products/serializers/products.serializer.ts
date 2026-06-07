import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Product } from '../models/product.model';
import { ProductResponseDto } from '../dto';
import { JsonApiSerializer } from '../../common/serializer/services/json-api.serializer';
import { JsonApiSingleResponse, JsonApiCollectionResponse } from '../../common/serializer/interfaces/json-api.interface';
import { encodeCursor } from '../../common/pagination/utils/cursor';
import { PAGINATION_DEFAULTS } from '../../common/pagination/constants/pagination.constants';

@Injectable()
export class ProductsSerializer {
	constructor(private readonly jsonApiSerializer: JsonApiSerializer) {}

	one(product: Product): JsonApiSingleResponse {
		return this.jsonApiSerializer.serializeOne('products', product.productToken, this.toAttributes(product));
	}

	many(products: Product[], meta: Record<string, unknown>, nextLink: string | null, pt?: string): JsonApiCollectionResponse {
		const items = products.map((p) => ({
			id: pt === PAGINATION_DEFAULTS.CURSOR_TYPE ? encodeCursor(p.id) : p.productToken,
			attributes: this.toAttributes(p)
		}));
		return this.jsonApiSerializer.serializeMany('products', items, meta, { next: nextLink });
	}

	cursorLink(pageSize: number, nextCursor: number | null): string | null {
		return nextCursor ? `/v1/products?pt=${PAGINATION_DEFAULTS.CURSOR_TYPE}&page[size]=${pageSize}&page[after]=${encodeCursor(nextCursor)}` : null;
	}

	offsetLink(page: number, limit: number, hasNext: boolean): string | null {
		return hasNext ? `/v1/products?page=${page + 1}&limit=${limit}` : null;
	}

	private toAttributes(product: Product): Record<string, unknown> {
		return plainToInstance(ProductResponseDto, product.toJSON(), { excludeExtraneousValues: true }) as unknown as Record<string, unknown>;
	}
}
