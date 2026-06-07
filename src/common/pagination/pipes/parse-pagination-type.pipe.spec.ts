import { BadRequestException } from '@nestjs/common';
import { ParsePaginationTypePipe } from './parse-pagination-type.pipe';

describe('ParsePaginationTypePipe', () => {
	const pipe = new ParsePaginationTypePipe();

	it('should return "ol" when value is undefined', () => {
		expect(pipe.transform(undefined)).toBe('ol');
	});

	it('should return "ol" when value is "ol"', () => {
		expect(pipe.transform('ol')).toBe('ol');
	});

	it('should return "cursor" when value is "cursor"', () => {
		expect(pipe.transform('cursor')).toBe('cursor');
	});

	it('should throw BadRequestException for invalid value', () => {
		expect(() => pipe.transform('invalid')).toThrow(BadRequestException);
	});
});
