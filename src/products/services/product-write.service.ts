import { ConflictException, Injectable } from '@nestjs/common';
import { ProductsRepository } from '../repositories/products.repository';
import { CreateProductDto, UpdateStockDto } from '../dto';
import { Product } from '../models/product.model';
import { RedisLazyCacheService } from '../../common/cache';
import { ProductReadService } from './product-read.service';

@Injectable()
export class ProductWriteService {
	constructor(
		private readonly productsRepository: ProductsRepository,
		private readonly cacheService: RedisLazyCacheService,
		private readonly productReadService: ProductReadService
	) {}

	async create(dto: CreateProductDto): Promise<Product> {
		const existing = await this.productsRepository.findByToken(dto.productToken);
		if (existing) {
			throw new ConflictException(`Product with token "${dto.productToken}" already exists`);
		}
		const product = await this.productsRepository.create(dto);
		await this.cacheService.delByPrefix('product:list');
		return product;
	}

	async updateStock(token: string, dto: UpdateStockDto): Promise<Product> {
		const product = await this.productReadService.findOneByToken(token);
		const updated = await this.productsRepository.updateStock(product, dto.stock);
		await Promise.all([this.cacheService.del(`product:detail:${token}`), this.cacheService.delByPrefix('product:list')]);
		return updated;
	}

	async remove(token: string): Promise<void> {
		const product = await this.productReadService.findOneByToken(token);
		await this.productsRepository.remove(product);
		await Promise.all([this.cacheService.del(`product:detail:${token}`), this.cacheService.delByPrefix('product:list')]);
	}
}
