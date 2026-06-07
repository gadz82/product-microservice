import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';

@Module({
	imports: [
		SequelizeModule.forRootAsync({
			useFactory: (configService: ConfigService) => ({
				dialect: 'mysql',
				host: configService.get<string>('database.host'),
				port: configService.get<number>('database.port'),
				username: configService.get<string>('database.user'),
				password: configService.get<string>('database.password'),
				database: configService.get<string>('database.name'),
				autoLoadModels: true,
				synchronize: false
			}),
			inject: [ConfigService]
		})
	]
})
export class DatabaseModule {}
