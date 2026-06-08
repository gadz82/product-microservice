import { encodeCursor, decodeCursor } from './cursor';

describe('cursor', () => {
	describe('encodeCursor', () => {
		it('should encode a number id to base64 string', () => {
			expect(encodeCursor(1)).toBe('MQ==');
			expect(encodeCursor(42)).toBe('NDI=');
			expect(encodeCursor(999)).toBe('OTk5');
		});
	});

	describe('decodeCursor', () => {
		it('should decode a valid base64 cursor to a number', () => {
			expect(decodeCursor('MQ==')).toBe(1);
			expect(decodeCursor('NDI=')).toBe(42);
			expect(decodeCursor('OTk5')).toBe(999);
		});

		it('should throw Error for invalid base64', () => {
			expect(() => decodeCursor('not-valid')).toThrow('Invalid cursor');
		});

		it('should throw Error for base64 that decodes to non-numeric', () => {
			expect(() => decodeCursor(Buffer.from('abc').toString('base64'))).toThrow('Invalid cursor');
		});
	});
});
