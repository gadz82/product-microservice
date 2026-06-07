import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Product } from './product.model';
import { CreateProductDto, UpdateStockDto } from './dto';

@Injectable()
export class ProductsService {
	constructor(@InjectModel(Product) private readonly productModel: typeof Product) {}

	async create(dto: CreateProductDto): Promise<Product> {
		const existing = await this.productModel.findOne({ where: { productToken: dto.productToken } });
		if (existing) {
			throw new ConflictException(`Product with token "${dto.productToken}" already exists`);
		}
		return this.productModel.create({ ...dto });
	}

	async findAll(page = 1, limit = 10): Promise<{ data: Product[]; total: number; page: number; limit: number }> {
		const offset = (page - 1) * limit;
		const { rows: data, count: total } = await this.productModel.findAndCountAll({ offset, limit, order: [['id', 'ASC']] });
		return { data, total, page, limit };
	}

	async findOne(id: number): Promise<Product> {
		const product = await this.productModel.findByPk(id);
		if (!product) {
			throw new NotFoundException(`Product with id ${id} not found`);
		}
		return product;
	}

	async updateStock(id: number, dto: UpdateStockDto): Promise<Product> {
		const product = await this.findOne(id);
		product.stock = dto.stock;
		return product.save();
	}

	async remove(id: number): Promise<void> {
		const product = await this.findOne(id);
		await product.destroy();
	}
}
