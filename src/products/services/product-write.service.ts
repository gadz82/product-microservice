import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { OptimisticLockError } from 'sequelize';
import { ProductsRepository } from '../repositories/products.repository';
import { CreateProductDto, UpdateStockDto } from '../dto';
import { Product } from '../models/product.model';
import { LoggerService } from '../../common/logger';

@Injectable()
export class ProductWriteService {
	constructor(
		private readonly productsRepository: ProductsRepository,
		private readonly logger: LoggerService
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
		const product = await this.productsRepository.findByToken(token);
		if (!product) {
			throw new NotFoundException(`Product with token "${token}" not found`);
		}
		product.stock = dto.stock;
		try {
			const updated = await product.save();
			this.logger.log(`Product stock updated: ${token} -> ${dto.stock}`, 'ProductWriteService');
			return updated;
		} catch (error) {
			if (error instanceof OptimisticLockError) {
				throw new ConflictException(`Product "${token}" was modified concurrently. Please retry.`);
			}
			throw error;
		}
	}

	async adjustStock(token: string, delta: number): Promise<Product> {
		const product = await this.productsRepository.findByToken(token);
		if (!product) {
			throw new NotFoundException(`Product with token "${token}" not found`);
		}
		const updated = await this.productsRepository.adjustStock(token, delta);
		if (!updated) {
			throw new ConflictException(`Insufficient stock for product "${token}". Cannot adjust by ${delta}.`);
		}
		this.logger.log(`Product stock adjusted: ${token} by ${delta}`, 'ProductWriteService');
		return updated;
	}

	async remove(token: string): Promise<void> {
		const product = await this.productsRepository.findByToken(token);
		if (!product) {
			throw new NotFoundException(`Product with token "${token}" not found`);
		}
		await this.productsRepository.remove(product);
	}
}
