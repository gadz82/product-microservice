import { Product } from '../models/product.model';

export interface PaginatedProducts {
	data: Product[];
	meta: Record<string, unknown>;
	nextCursor: number | null;
	page?: number;
	limit?: number;
}
