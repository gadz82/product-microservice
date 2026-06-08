import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Inject } from '@nestjs/common';
import { Request, Response } from 'express';
import { BaseError, UniqueConstraintError, ValidationError, ForeignKeyConstraintError, ConnectionError } from 'sequelize';
import { LoggerService } from '../logger';

@Catch(BaseError)
export class DatabaseExceptionFilter implements ExceptionFilter {
	constructor(@Inject(LoggerService) private readonly logger: LoggerService) {}

	catch(exception: BaseError, host: ArgumentsHost): void {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest<Request>();

		const { status, message } = this.mapException(exception);

		this.logger.error(`DB error on ${request.method} ${request.url}: ${exception.message}`, DatabaseExceptionFilter.name);

		response.status(status).json({
			statusCode: status,
			error: HttpStatus[status] ?? 'Error',
			message,
			path: request.url,
			timestamp: new Date().toISOString()
		});
	}

	private mapException(exception: BaseError): { status: number; message: string } {
		if (exception instanceof UniqueConstraintError) {
			return { status: HttpStatus.CONFLICT, message: 'A record with the given unique field already exists' };
		}
		if (exception instanceof ValidationError) {
			return { status: HttpStatus.UNPROCESSABLE_ENTITY, message: exception.errors.map((e) => e.message).join(', ') };
		}
		if (exception instanceof ForeignKeyConstraintError) {
			return { status: HttpStatus.UNPROCESSABLE_ENTITY, message: 'Referenced resource does not exist' };
		}
		if (exception instanceof ConnectionError) {
			return { status: HttpStatus.SERVICE_UNAVAILABLE, message: 'Database connection error' };
		}
		return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'An unexpected database error occurred' };
	}
}
