import { BadRequestException } from '@nestjs/common';
import { ParsePaginationTypePipe } from './parse-pagination-type.pipe';

describe('ParsePaginationTypePipe', () => {
	const pipe = new ParsePaginationTypePipe();

	it('should return "offset" when value is undefined', () => {
		expect(pipe.transform(undefined)).toBe('offset');
	});

	it('should return "offset" when value is "offset"', () => {
		expect(pipe.transform('offset')).toBe('offset');
	});

	it('should return "cursor" when value is "cursor"', () => {
		expect(pipe.transform('cursor')).toBe('cursor');
	});

	it('should throw BadRequestException for invalid value', () => {
		expect(() => pipe.transform('invalid')).toThrow(BadRequestException);
	});
});
