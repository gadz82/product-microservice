import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger(HttpExceptionFilter.name);

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

		response.status(status).json({
			statusCode: status,
			error: HttpStatus[status] ?? 'Error',
			message,
			path: request.url,
			timestamp: new Date().toISOString()
		});
	}
}
