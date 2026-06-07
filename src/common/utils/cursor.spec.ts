import { encodeCursor, decodeCursor } from './cursor';

describe('Cursor Utils', () => {
	it('should encode and decode a cursor round-trip', () => {
		const encoded = encodeCursor(42);
		expect(decodeCursor(encoded)).toBe(42);
	});

	it('should produce base64 output', () => {
		const encoded = encodeCursor(1);
		expect(encoded).toBe(Buffer.from('1').toString('base64'));
	});

	it('should throw on invalid cursor', () => {
		expect(() => decodeCursor('not-valid-base64-number')).toThrow('Invalid cursor');
	});
});
