import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Product } from './models/product.model';
import { ProductsRepository } from './repositories/products.repository';
import { ProductReadService } from './services/product-read.service';
import { ProductWriteService } from './services/product-write.service';
import { ProductsSerializer } from './serializers/products.serializer';
import { ProductsController } from './controllers/products.controller';
import { CommonModule } from '../common/common.module';

@Module({
	imports: [SequelizeModule.forFeature([Product]), CommonModule],
	controllers: [ProductsController],
	providers: [ProductsRepository, ProductReadService, ProductWriteService, ProductsSerializer],
	exports: [ProductReadService]
})
export class ProductsModule {}
