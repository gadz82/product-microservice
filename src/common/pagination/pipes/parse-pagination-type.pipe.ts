import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { PAGINATION_DEFAULTS, PAGINATION_TYPES } from '../constants/pagination.constants';

export type PaginationType = (typeof PAGINATION_TYPES)[number];

@Injectable()
export class ParsePaginationTypePipe implements PipeTransform<string | undefined, PaginationType> {
	transform(value: string | undefined): PaginationType {
		if (!value) return PAGINATION_DEFAULTS.TYPE;
		if ((PAGINATION_TYPES as readonly string[]).includes(value)) return value as PaginationType;
		throw new BadRequestException(`Invalid pagination type "${value}". Allowed: ${PAGINATION_TYPES.join(', ')}`);
	}
}
