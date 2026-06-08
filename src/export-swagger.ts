import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Module } from '@nestjs/common';
import { writeFileSync } from 'fs';
import { ProductsController } from './products/controllers/products.controller';
import { ProductReadService } from './products/services/product-read.service';
import { ProductWriteService } from './products/services/product-write.service';
import { ProductsSerializer } from './products/serializers/products.serializer';

@Module({
	controllers: [ProductsController],
	providers: [
		{ provide: ProductReadService, useValue: {} },
		{ provide: ProductWriteService, useValue: {} },
		{ provide: ProductsSerializer, useValue: {} }
	]
})
class SwaggerAppModule {}

async function exportSwagger(): Promise<void> {
	const app = await NestFactory.create(SwaggerAppModule, { logger: false });
	const config = new DocumentBuilder()
		.setTitle('Products Service')
		.setDescription('The products microservice API description')
		.setVersion('1.0')
		.addTag('products')
		.build();
	const document = SwaggerModule.createDocument(app, config);
	writeFileSync('./openapi.json', JSON.stringify(document, null, 2));
	await app.close();
	process.exit(0);
}

exportSwagger();
