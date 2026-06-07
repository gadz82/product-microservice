import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

export type PaginationType = 'ol' | 'cursor';

@Injectable()
export class ParsePaginationTypePipe implements PipeTransform<string | undefined, PaginationType> {
	private readonly allowedTypes: PaginationType[] = ['ol', 'cursor'];
	transform(value: string | undefined): PaginationType {
		if (!value) return 'ol';
		if (this.allowedTypes.includes(value as PaginationType)) return value as PaginationType;
		throw new BadRequestException(`Invalid pagination type "${value}". Allowed: ol, cursor`);
	}
}
