import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Product } from './product.model';
import { ProductResponseDto } from './dto';
import { serializeOne, serializeMany, JsonApiSingleResponse, JsonApiCollectionResponse } from '../common/serializers';
import { encodeCursor } from '../common/utils';

@Injectable()
export class ProductsSerializer {
	one(product: Product): JsonApiSingleResponse {
		return serializeOne('products', product.productToken, this.toAttributes(product));
	}

	many(products: Product[], meta: Record<string, unknown>, nextLink: string | null): JsonApiCollectionResponse {
		const items = products.map((p) => ({ id: p.productToken, attributes: this.toAttributes(p) }));
		return serializeMany('products', items, meta, { next: nextLink });
	}

	cursorLink(pageSize: number, nextCursor: number | null): string | null {
		return nextCursor ? `/products?pt=cursor&page[size]=${pageSize}&page[after]=${encodeCursor(nextCursor)}` : null;
	}

	offsetLink(page: number, limit: number, hasNext: boolean): string | null {
		return hasNext ? `/products?page=${page + 1}&limit=${limit}` : null;
	}

	private toAttributes(product: Product): Record<string, unknown> {
		return plainToInstance(ProductResponseDto, product.toJSON(), { excludeExtraneousValues: true }) as unknown as Record<string, unknown>;
	}
}
