import { ConflictException, Injectable } from '@nestjs/common';
import { ProductsRepository } from '../repositories/products.repository';
import { CreateProductDto, UpdateStockDto } from '../dto';
import { Product } from '../models/product.model';
import { ProductReadService } from './product-read.service';

@Injectable()
export class ProductWriteService {
	constructor(
		private readonly productsRepository: ProductsRepository,
		private readonly productReadService: ProductReadService
	) {}

	async create(dto: CreateProductDto): Promise<Product> {
		const existing = await this.productsRepository.findByToken(dto.productToken);
		if (existing) {
			throw new ConflictException(`Product with token "${dto.productToken}" already exists`);
		}
		return await this.productsRepository.create(dto);
	}

	async updateStock(token: string, dto: UpdateStockDto): Promise<Product> {
		const product = await this.productReadService.findOneByToken(token);
		return await this.productsRepository.updateStock(product, dto.stock);
	}

	async remove(token: string): Promise<void> {
		const product = await this.productReadService.findOneByToken(token);
		await this.productsRepository.remove(product);
	}
}
