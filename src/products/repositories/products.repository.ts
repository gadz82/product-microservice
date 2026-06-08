import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Product } from '../models/product.model';
import { CreateProductDto } from '../dto';
import { CursorPaginationOptions, CursorPaginatedResult, OffsetPaginationOptions, OffsetPaginatedResult } from '../../common/pagination';

@Injectable()
export class ProductsRepository {
	constructor(@InjectModel(Product) private readonly productModel: typeof Product) {}

	async create(dto: CreateProductDto): Promise<Product> {
		return this.productModel.create({ ...dto });
	}

	async findByToken(token: string): Promise<Product | null> {
		return this.productModel.findOne({ where: { productToken: token } });
	}

	async findById(id: number): Promise<Product | null> {
		return this.productModel.findByPk(id);
	}

	async findAll(options: CursorPaginationOptions): Promise<CursorPaginatedResult<Product>> {
		const { size, after } = options;
		const where: Record<string, unknown> = {};
		if (after) {
			where.id = { [Op.gt]: after };
		}
		const rows = await this.productModel.findAll({
			where,
			order: [['id', 'ASC']],
			limit: size + 1
		});
		const hasNext = rows.length > size;
		const data = hasNext ? rows.slice(0, size) : rows;
		const nextCursor = hasNext ? data[data.length - 1].id : null;
		return { data, hasNext, nextCursor };
	}

	async findAllOffset(options: OffsetPaginationOptions): Promise<OffsetPaginatedResult<Product>> {
		const { page, limit } = options;
		const offset = (page - 1) * limit;
		const { rows: data, count: total } = await this.productModel.findAndCountAll({
			offset,
			limit,
			order: [['id', 'ASC']]
		});
		return { data, total, page, limit };
	}

	async updateStock(product: Product, stock: number): Promise<Product> {
		product.stock = stock;
		return product.save();
	}

	async remove(product: Product): Promise<void> {
		await product.destroy();
	}

}
