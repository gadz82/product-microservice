import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Product } from './product.model';
import { CreateProductDto } from './dto';

export interface CursorPaginationOptions {
	size: number;
	after?: number;
	attributes?: string[];
}

export interface CursorPaginatedResult {
	data: Product[];
	hasNext: boolean;
	nextCursor: number | null;
}

@Injectable()
export class ProductsRepository {
	constructor(@InjectModel(Product) private readonly productModel: typeof Product) {}

	async create(dto: CreateProductDto): Promise<Product> {
		return this.productModel.create({ ...dto });
	}

	async findByToken(token: string): Promise<Product | null> {
		return this.productModel.findOne({ where: { productToken: token } });
	}

	async findById(id: number, attributes?: string[]): Promise<Product | null> {
		return this.productModel.findByPk(id, attributes ? { attributes } : undefined);
	}

	async findAll(options: CursorPaginationOptions): Promise<CursorPaginatedResult> {
		const { size, after, attributes } = options;
		const where: Record<string, unknown> = {};
		if (after) {
			where.id = { [Op.gt]: after };
		}
		const rows = await this.productModel.findAll({
			where,
			order: [['id', 'ASC']],
			limit: size + 1,
			...(attributes ? { attributes } : {})
		});
		const hasNext = rows.length > size;
		const data = hasNext ? rows.slice(0, size) : rows;
		const nextCursor = hasNext ? data[data.length - 1].id : null;
		return { data, hasNext, nextCursor };
	}

	async updateStock(product: Product, stock: number): Promise<Product> {
		product.stock = stock;
		return product.save();
	}

	async remove(product: Product): Promise<void> {
		await product.destroy();
	}
}
