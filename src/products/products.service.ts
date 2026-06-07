import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { CreateProductDto, UpdateStockDto } from './dto';
import { Product } from './product.model';

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

	async findAll(size: number, after?: number, attributes?: string[]): Promise<{ data: Product[]; hasNext: boolean; nextCursor: number | null }> {
		return this.productsRepository.findAll({ size, after, attributes });
	}

	async findAllOffset(
		page: number,
		limit: number,
		attributes?: string[]
	): Promise<{ data: Product[]; total: number; page: number; limit: number }> {
		return this.productsRepository.findAllOffset({ page, limit, attributes });
	}

	async findOne(id: number, attributes?: string[]): Promise<Product> {
		const product = await this.productsRepository.findById(id, attributes);
		if (!product) {
			throw new NotFoundException(`Product with id ${id} not found`);
		}
		return product;
	}

	async updateStock(id: number, dto: UpdateStockDto): Promise<Product> {
		const product = await this.findOne(id);
		return this.productsRepository.updateStock(product, dto.stock);
	}

	async remove(id: number): Promise<void> {
		const product = await this.findOne(id);
		await this.productsRepository.remove(product);
	}
}
