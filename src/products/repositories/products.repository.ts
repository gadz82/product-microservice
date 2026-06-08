import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Product } from '../models/product.model';
import { CreateProductDto } from '../dto';
import { CursorPaginationOptions, CursorPaginatedResult, OffsetPaginationOptions, OffsetPaginatedResult } from '../../common/pagination';

@Injectable()
export class ProductsRepository {
	private readonly logger = new Logger(ProductsRepository.name);

	constructor(@InjectModel(Product) private readonly productModel: typeof Product) {}

	async create(dto: CreateProductDto): Promise<Product> {
		try {
			return await this.productModel.create({ ...dto });
		} catch (error) {
			this.logger.error('Failed to create product', error);
			throw error;
		}
	}

	async findByToken(token: string): Promise<Product | null> {
		try {
			return await this.productModel.findOne({ where: { productToken: token } });
		} catch (error) {
			this.logger.error(`Failed to find product by token "${token}"`, error);
			throw error;
		}
	}

	async findById(id: number): Promise<Product | null> {
		try {
			return await this.productModel.findByPk(id);
		} catch (error) {
			this.logger.error(`Failed to find product by id ${id}`, error);
			throw error;
		}
	}

	async findAll(options: CursorPaginationOptions): Promise<CursorPaginatedResult<Product>> {
		const { size, after } = options;
		const where: Record<string, unknown> = {};
		if (after) {
			where.id = { [Op.gt]: after };
		}
		try {
			const rows = await this.productModel.findAll({
				where,
				order: [['id', 'ASC']],
				limit: size + 1
			});
			const hasNext = rows.length > size;
			const data = hasNext ? rows.slice(0, size) : rows;
			const nextCursor = hasNext ? data[data.length - 1].id : null;
			return { data, hasNext, nextCursor };
		} catch (error) {
			this.logger.error('Failed to fetch products (cursor)', error);
			throw error;
		}
	}

	async findAllOffset(options: OffsetPaginationOptions): Promise<OffsetPaginatedResult<Product>> {
		const { page, limit } = options;
		const offset = (page - 1) * limit;
		try {
			const { rows: data, count: total } = await this.productModel.findAndCountAll({
				offset,
				limit,
				order: [['id', 'ASC']]
			});
			return { data, total, page, limit };
		} catch (error) {
			this.logger.error('Failed to fetch products (offset)', error);
			throw error;
		}
	}

	async updateStock(product: Product, stock: number): Promise<Product> {
		try {
			product.stock = stock;
			return await product.save();
		} catch (error) {
			this.logger.error(`Failed to update stock for product id ${product.id}`, error);
			throw error;
		}
	}

	async remove(product: Product): Promise<void> {
		try {
			await product.destroy();
		} catch (error) {
			this.logger.error(`Failed to remove product id ${product.id}`, error);
			throw new InternalServerErrorException('Failed to remove product');
		}
	}
}
