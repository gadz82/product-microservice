import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { PaginationModule } from './pagination';
import { JsonApiModule } from './serializer';
@Module({
	imports: [DatabaseModule, PaginationModule, JsonApiModule],
	exports: [DatabaseModule, PaginationModule, JsonApiModule]
})
export class CommonModule {}
