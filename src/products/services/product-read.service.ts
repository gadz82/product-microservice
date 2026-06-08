import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ProductsRepository } from '../repositories/products.repository';
import { Product } from '../models/product.model';
import { PaginationType, decodeCursor, PAGINATION_DEFAULTS } from '../../common/pagination';
import { PaginatedProducts } from '../interfaces/paginated-products.interface';
@Injectable()
export class ProductReadService {
	constructor(private readonly productsRepository: ProductsRepository) {}
	async list(pt: PaginationType, page?: number, limit?: number, size?: number, after?: string): Promise<PaginatedProducts> {
		let result: PaginatedProducts;
		if (pt === PAGINATION_DEFAULTS.CURSOR_TYPE) {
			const pageSize = size ?? PAGINATION_DEFAULTS.SIZE;
			let afterId: number | undefined;
			if (after) {
				try {
					afterId = decodeCursor(after);
				} catch {
					throw new BadRequestException('Invalid cursor');
				}
			}
			const repoResult = await this.productsRepository.findAll({ size: pageSize, after: afterId });
			result = { data: repoResult.data, meta: { hasNext: repoResult.hasNext }, nextCursor: repoResult.nextCursor };
		} else {
			const pageNum = page ?? PAGINATION_DEFAULTS.PAGE;
			const pageLimit = limit ?? PAGINATION_DEFAULTS.LIMIT;
			const repoResult = await this.productsRepository.findAllOffset({ page: pageNum, limit: pageLimit });
			const hasNext = repoResult.page * repoResult.limit < repoResult.total;
			result = {
				data: repoResult.data,
				meta: { hasNext, total: repoResult.total, page: repoResult.page, limit: repoResult.limit },
				nextCursor: null,
				page: repoResult.page,
				limit: repoResult.limit
			};
		}
		return result;
	}
	async findOneByToken(token: string): Promise<Product> {
		const product = await this.productsRepository.findByToken(token);
		if (!product) {
			throw new NotFoundException(`Product with token "${token}" not found`);
		}
		return product;
	}
}
