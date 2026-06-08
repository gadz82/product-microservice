import { ConflictException, Injectable } from '@nestjs/common';
import { ProductsRepository } from '../repositories/products.repository';
import { CreateProductDto, UpdateStockDto } from '../dto';
import { Product } from '../models/product.model';
import { ProductReadService } from './product-read.service';
import { LoggerService } from '../../common/logger';

@Injectable()
export class ProductWriteService {
	private readonly logger = new LoggerService();

	constructor(
		private readonly productsRepository: ProductsRepository,
		private readonly productReadService: ProductReadService
	) {}

	async create(dto: CreateProductDto): Promise<Product> {
		const existing = await this.productsRepository.findByToken(dto.productToken);
		if (existing) {
			throw new ConflictException(`Product with token "${dto.productToken}" already exists`);
		}
		const product = await this.productsRepository.create(dto);
		this.logger.log(`Product created: ${product.productToken}`, 'ProductWriteService');
		return product;
	}

	async updateStock(token: string, dto: UpdateStockDto): Promise<Product> {
		const product = await this.productReadService.findOneByToken(token);
		const updated = await this.productsRepository.updateStock(product, dto.stock);
		this.logger.log(`Product stock updated: ${token} -> ${dto.stock}`, 'ProductWriteService');
		return updated;
	}

	async remove(token: string): Promise<void> {
		const product = await this.productReadService.findOneByToken(token);
		await this.productsRepository.remove(product);
	}
}
