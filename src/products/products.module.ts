import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Product } from './product.model';
import { ProductsRepository } from './products.repository';
import { ProductsService } from './products.service';
import { ProductsSerializer } from './products.serializer';
import { ProductsController } from './products.controller';

@Module({
	imports: [SequelizeModule.forFeature([Product])],
	controllers: [ProductsController],
	providers: [ProductsRepository, ProductsService, ProductsSerializer],
	exports: [ProductsService]
})
export class ProductsModule {}
