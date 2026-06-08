import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter, DatabaseExceptionFilter } from './common/filters';
import { LoggerService } from './common/logger';

async function bootstrap(): Promise<void> {
	const app = await NestFactory.create(AppModule);
	app.enableVersioning({
		type: VersioningType.URI,
		defaultVersion: '1'
	});
	app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
	const logger = new LoggerService();
	app.useGlobalFilters(new DatabaseExceptionFilter(logger), new HttpExceptionFilter(logger));

	const config = new DocumentBuilder()
		.setTitle('Products Service')
		.setDescription('The products microservice API description')
		.setVersion('1.0')
		.addTag('products')
		.build();
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api/docs', app, document);

	const configService = app.get(ConfigService);
	const port = configService.get<number>('port', 3000);
	await app.listen(port);
}
bootstrap();
