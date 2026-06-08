import { validate } from './env.validation';

describe('EnvValidation', () => {
	describe('validate', () => {
		it('should pass with all required env vars', () => {
			const config = { DB_HOST: 'localhost', DB_NAME: 'ecommerce', DB_USER: 'user', DB_PASSWORD: 'pass' };
			expect(() => validate(config)).not.toThrow();
		});

		it('should throw when required vars are missing', () => {
			expect(() => validate({})).toThrow('Environment validation failed');
		});

		it('should coerce PORT to number', () => {
			const config = { PORT: '4000', DB_HOST: 'localhost', DB_NAME: 'db', DB_USER: 'u', DB_PASSWORD: 'p' };
			const result = validate(config);
			expect(result.PORT).toBe(4000);
		});

		it('should accept valid LOGGER_LEVEL values', () => {
			const config = { DB_HOST: 'localhost', DB_NAME: 'db', DB_USER: 'u', DB_PASSWORD: 'p', LOGGER_LEVEL: 'WARNING' };
			const result = validate(config);
			expect(result.LOGGER_LEVEL).toBe('WARNING');
		});

		it('should default LOGGER_LEVEL to DEBUG when omitted', () => {
			const config = { DB_HOST: 'localhost', DB_NAME: 'db', DB_USER: 'u', DB_PASSWORD: 'p' };
			const result = validate(config);
			expect(result.LOGGER_LEVEL).toBe('DEBUG');
		});

		it('should reject invalid LOGGER_LEVEL', () => {
			const config = { DB_HOST: 'localhost', DB_NAME: 'db', DB_USER: 'u', DB_PASSWORD: 'p', LOGGER_LEVEL: 'INVALID' };
			expect(() => validate(config)).toThrow('Environment validation failed');
		});
	});
});
