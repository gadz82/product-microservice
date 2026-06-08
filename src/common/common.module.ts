import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { PaginationModule } from './pagination';
import { JsonApiModule } from './serializer';
import { LoggerService } from './logger';
import { HealthModule } from './health';
@Module({
	imports: [DatabaseModule, PaginationModule, JsonApiModule, HealthModule],
	providers: [LoggerService],
	exports: [DatabaseModule, PaginationModule, JsonApiModule, LoggerService]
})
export class CommonModule {}
