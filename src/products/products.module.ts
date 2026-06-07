import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Product } from './product.model';
import { ProductsRepository } from './products.repository';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

@Module({
	imports: [SequelizeModule.forFeature([Product])],
	controllers: [ProductsController],
	providers: [ProductsRepository, ProductsService],
	exports: [ProductsService]
})
export class ProductsModule {}
