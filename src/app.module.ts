import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from './common/common.module';
import { configuration, validate } from './common/config';
import { ProductsModule } from './products/products.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
			validate
		}),
		CommonModule,
		ProductsModule
	],
	controllers: [],
	providers: []
})
export class AppModule {}
