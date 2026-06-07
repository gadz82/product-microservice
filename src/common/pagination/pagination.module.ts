import { Module } from '@nestjs/common';
import { ParsePaginationTypePipe } from './pipes/parse-pagination-type.pipe';

@Module({
	providers: [ParsePaginationTypePipe],
	exports: [ParsePaginationTypePipe]
})
export class PaginationModule {}
