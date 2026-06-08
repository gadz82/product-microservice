import { HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';
import { LoggerService } from '../logger';
import { ConfigService } from '@nestjs/config';

describe('HttpExceptionFilter', () => {
	let filter: HttpExceptionFilter;
	let mockResponse: { status: jest.Mock; json: jest.Mock };
	let mockRequest: { method: string; url: string };
	let mockHost: { switchToHttp: jest.Mock };
	let mockLogger: jest.Mocked<LoggerService>;
	let mockConfigService: { get: jest.Mock };

	beforeEach(() => {
		mockLogger = {
			log: jest.fn(),
			debug: jest.fn(),
			verbose: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			fatal: jest.fn()
		} as unknown as jest.Mocked<LoggerService>;
		mockConfigService = { get: jest.fn().mockReturnValue('development') };
		filter = new HttpExceptionFilter(mockLogger, mockConfigService as unknown as ConfigService);
		mockResponse = { status: jest.fn().mockReturnThis(), json: jest.fn() };
		mockRequest = { method: 'GET', url: '/v1/products' };
		mockHost = {
			switchToHttp: jest.fn().mockReturnValue({
				getResponse: () => mockResponse,
				getRequest: () => mockRequest
			})
		};
	});

	it('should format a string-response HttpException', () => {
		const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);
		filter.catch(exception, mockHost as never);
		expect(mockResponse.status).toHaveBeenCalledWith(404);
		const body = mockResponse.json.mock.calls[0][0];
		expect(body.statusCode).toBe(404);
		expect(body.message).toBe('Not found');
		expect(body.path).toBe('/v1/products');
		expect(body.timestamp).toBeDefined();
	});

	it('should extract message from object-response HttpException', () => {
		const exception = new HttpException({ message: ['field is required'], error: 'Bad Request' }, HttpStatus.BAD_REQUEST);
		filter.catch(exception, mockHost as never);
		const body = mockResponse.json.mock.calls[0][0];
		expect(body.statusCode).toBe(400);
		expect(body.message).toEqual(['field is required']);
	});

	it('should include error label from HttpStatus', () => {
		const exception = new HttpException('Conflict', HttpStatus.CONFLICT);
		filter.catch(exception, mockHost as never);
		const body = mockResponse.json.mock.calls[0][0];
		expect(body.error).toBe('CONFLICT');
	});

	it('should fallback error label to "Error" for unknown status code', () => {
		const exception = new HttpException('Custom', 999);
		filter.catch(exception, mockHost as never);
		const body = mockResponse.json.mock.calls[0][0];
		expect(body.error).toBe('Error');
	});

	it('should return generic message in production', () => {
		mockConfigService.get.mockReturnValue('production');
		const exception = new HttpException({ message: ['field is required'], error: 'Bad Request' }, HttpStatus.BAD_REQUEST);
		filter.catch(exception, mockHost as never);
		const body = mockResponse.json.mock.calls[0][0];
		expect(body.message).toBe('BAD_REQUEST');
	});
});
