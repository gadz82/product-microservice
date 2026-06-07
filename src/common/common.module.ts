import { Module } from '@nestjs/common';
import { CacheModule } from './cache/cache.module';
import { DatabaseModule } from './database/database.module';
import { PaginationModule } from './pagination/pagination.module';
import { JsonApiModule } from './serializer/json-api.module';

@Module({
	imports: [CacheModule, DatabaseModule, PaginationModule, JsonApiModule],
	exports: [CacheModule, DatabaseModule, PaginationModule, JsonApiModule]
})
export class CommonModule {}
