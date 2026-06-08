import { HttpStatus } from '@nestjs/common';
import { UniqueConstraintError, ValidationError, ValidationErrorItem, ForeignKeyConstraintError, ConnectionError, BaseError } from 'sequelize'; // ValidationErrorItem used as type cast
import { DatabaseExceptionFilter } from './database-exception.filter';
import { LoggerService } from '../logger';

class GenericDbError extends BaseError {
	constructor(message: string) {
		super(message);
		this.name = 'GenericDbError';
	}
}

describe('DatabaseExceptionFilter', () => {
	let filter: DatabaseExceptionFilter;
	let mockResponse: { status: jest.Mock; json: jest.Mock };
	let mockRequest: { method: string; url: string };
	let mockHost: { switchToHttp: jest.Mock };
	let mockLogger: jest.Mocked<LoggerService>;

	beforeEach(() => {
		mockLogger = {
			log: jest.fn(),
			debug: jest.fn(),
			verbose: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			fatal: jest.fn()
		} as unknown as jest.Mocked<LoggerService>;
		filter = new DatabaseExceptionFilter(mockLogger);
		mockResponse = { status: jest.fn().mockReturnThis(), json: jest.fn() };
		mockRequest = { method: 'POST', url: '/v1/products' };
		mockHost = {
			switchToHttp: jest.fn().mockReturnValue({
				getResponse: () => mockResponse,
				getRequest: () => mockRequest
			})
		};
	});

	it('should map UniqueConstraintError to 409 CONFLICT', () => {
		const exception = new UniqueConstraintError({ errors: [] });
		filter.catch(exception, mockHost as never);
		expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
		const body = mockResponse.json.mock.calls[0][0];
		expect(body.statusCode).toBe(409);
		expect(body.message).toBe('A record with the given unique field already exists');
	});

	it('should map ValidationError to 422 UNPROCESSABLE_ENTITY', () => {
		const item = { message: 'name is required' } as ValidationErrorItem;
		const exception = new ValidationError('Validation error', [item]);
		filter.catch(exception, mockHost as never);
		expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
		const body = mockResponse.json.mock.calls[0][0];
		expect(body.message).toBe('name is required');
	});

	it('should map ForeignKeyConstraintError to 422 UNPROCESSABLE_ENTITY', () => {
		const exception = new ForeignKeyConstraintError({ fields: {}, table: '', value: null, index: '', reltype: 'parent' as never });
		filter.catch(exception, mockHost as never);
		expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
		const body = mockResponse.json.mock.calls[0][0];
		expect(body.message).toBe('Referenced resource does not exist');
	});

	it('should map ConnectionError to 503 SERVICE_UNAVAILABLE', () => {
		const exception = new ConnectionError(new Error('ECONNREFUSED'));
		filter.catch(exception, mockHost as never);
		expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
		const body = mockResponse.json.mock.calls[0][0];
		expect(body.message).toBe('Database connection error');
	});

	it('should map unknown BaseError to 500 INTERNAL_SERVER_ERROR', () => {
		const exception = new GenericDbError('unknown db error');
		filter.catch(exception, mockHost as never);
		expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
		const body = mockResponse.json.mock.calls[0][0];
		expect(body.message).toBe('An unexpected database error occurred');
	});

	it('should fallback error label to "Error" for unmapped status', () => {
		// Force mapException to return a status not in HttpStatus enum by spying
		const exception = new GenericDbError('error');
		jest.spyOn(filter as never, 'mapException').mockReturnValue({ status: 999, message: 'custom' } as never);
		filter.catch(exception, mockHost as never);
		const body = mockResponse.json.mock.calls[0][0];
		expect(body.error).toBe('Error');
	});

	it('should include path and timestamp in response', () => {
		const exception = new GenericDbError('error');
		filter.catch(exception, mockHost as never);
		const body = mockResponse.json.mock.calls[0][0];
		expect(body.path).toBe('/v1/products');
		expect(body.timestamp).toBeDefined();
	});
});
