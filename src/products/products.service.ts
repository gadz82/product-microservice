import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { CreateProductDto, UpdateStockDto } from './dto';
import { Product } from './product.model';
import { CursorPaginatedResult, OffsetPaginatedResult } from '../common/interfaces';

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

	async findAll(size: number, after?: number): Promise<CursorPaginatedResult<Product>> {
		return this.productsRepository.findAll({ size, after });
	}

	async findAllOffset(page: number, limit: number): Promise<OffsetPaginatedResult<Product>> {
		return this.productsRepository.findAllOffset({ page, limit });
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
