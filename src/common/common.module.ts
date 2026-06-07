import { Module } from '@nestjs/common';
import { CacheModule } from './cache';
import { DatabaseModule } from './database/database.module';
import { PaginationModule } from './pagination';
import { JsonApiModule } from './serializer';

@Module({
	imports: [CacheModule, DatabaseModule, PaginationModule, JsonApiModule],
	exports: [CacheModule, DatabaseModule, PaginationModule, JsonApiModule]
})
export class CommonModule {}
