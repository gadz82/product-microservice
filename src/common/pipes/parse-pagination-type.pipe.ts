import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

export type PaginationType = 'ol' | 'cursor';

@Injectable()
export class ParsePaginationTypePipe implements PipeTransform<string | undefined, PaginationType> {
	transform(value: string | undefined): PaginationType {
		if (!value) return 'ol';
		if (value === 'ol' || value === 'cursor') return value;
		throw new BadRequestException(`Invalid pagination type "${value}". Allowed: ol, cursor`);
	}
}
