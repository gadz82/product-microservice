import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { CreateProductDto, UpdateStockDto } from './dto';
import { Product } from './product.model';
import { PaginationType } from '../common/pipes';
import { decodeCursor } from '../common/utils';

export interface PaginatedProducts {
	data: Product[];
	meta: Record<string, unknown>;
	nextCursor: number | null;
	page?: number;
	limit?: number;
}

@Injectable()
export class ProductsService {
	constructor(private readonly productsRepository: ProductsRepository) {}

	async create(dto: CreateProductDto): Promise<Product> {
		const existing = await this.productsRepository.findByToken(dto.productToken);
		if (existing) {
			throw new ConflictException(`Product with token "${dto.productToken}" already exists`);
		}
		return this.productsRepository.create(dto);
	}

	async list(pt: PaginationType, page?: number, limit?: number, size?: number, after?: string): Promise<PaginatedProducts> {
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
			const result = await this.productsRepository.findAll({ size: pageSize, after: afterId });
			return { data: result.data, meta: { hasNext: result.hasNext }, nextCursor: result.nextCursor };
		}

		const pageNum = page ?? 1;
		const pageLimit = limit ?? 10;
		const result = await this.productsRepository.findAllOffset({ page: pageNum, limit: pageLimit });
		const hasNext = result.page * result.limit < result.total;
		return {
			data: result.data,
			meta: { hasNext, total: result.total, page: result.page, limit: result.limit },
			nextCursor: null,
			page: result.page,
			limit: result.limit
		};
	}

	async findOneByToken(token: string): Promise<Product> {
		const product = await this.productsRepository.findByToken(token);
		if (!product) {
			throw new NotFoundException(`Product with token "${token}" not found`);
		}
		return product;
	}

	async updateStock(token: string, dto: UpdateStockDto): Promise<Product> {
		const product = await this.findOneByToken(token);
		return this.productsRepository.updateStock(product, dto.stock);
	}

	async remove(token: string): Promise<void> {
		const product = await this.findOneByToken(token);
		await this.productsRepository.remove(product);
	}
}
