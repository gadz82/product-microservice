import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { LoggerService } from '../logger';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
	constructor(
		@Inject(LoggerService) private readonly logger: LoggerService,
		private readonly configService: ConfigService
	) {}

	catch(exception: HttpException, host: ArgumentsHost): void {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest<Request>();
		const status = exception.getStatus();
		const exceptionResponse = exception.getResponse();

		const message =
			typeof exceptionResponse === 'object' && 'message' in exceptionResponse
				? (exceptionResponse as Record<string, unknown>).message
				: exceptionResponse;

		this.logger.warn(`HTTP ${status} — ${request.method} ${request.url}: ${JSON.stringify(message)}`);

		const isProd = this.configService.get<string>('nodeEnv') === 'production';

		response.status(status).json({
			statusCode: status,
			error: HttpStatus[status] ?? 'Error',
			message: isProd ? HttpStatus[status] : message,
			path: request.url,
			timestamp: new Date().toISOString()
		});
	}
}
