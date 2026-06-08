import { Injectable } from '@nestjs/common';
import { LoggerService as NestLoggerService } from '@nestjs/common';

type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'SILENT';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
	DEBUG: 0,
	INFO: 1,
	WARNING: 2,
	ERROR: 3,
	SILENT: 4
};

@Injectable()
export class LoggerService implements NestLoggerService {
	private readonly level: LogLevel;

	constructor() {
		const raw = (process.env.LOGGER_LEVEL ?? 'DEBUG').toUpperCase();
		this.level = (raw in LEVEL_PRIORITY ? raw : 'DEBUG') as LogLevel;
	}

	private shouldLog(target: LogLevel): boolean {
		return LEVEL_PRIORITY[target] >= LEVEL_PRIORITY[this.level];
	}

	private fmt(prefix: string, message: unknown, context?: string): string {
		return `[${prefix}]${context ? ` [${context}]` : ''} ${message}`;
	}

	log(message: unknown, context?: string): void {
		if (this.shouldLog('INFO')) {
			console.log(this.fmt('INFO', message, context));
		}
	}

	debug(message: unknown, context?: string): void {
		if (this.shouldLog('DEBUG')) {
			console.debug(this.fmt('DEBUG', message, context));
		}
	}

	verbose(message: unknown, context?: string): void {
		if (this.shouldLog('DEBUG')) {
			console.debug(this.fmt('VERBOSE', message, context));
		}
	}

	warn(message: unknown, context?: string): void {
		if (this.shouldLog('WARNING')) {
			console.warn(this.fmt('WARNING', message, context));
		}
	}

	error(message: unknown, context?: string): void {
		if (this.shouldLog('ERROR')) {
			console.error(this.fmt('ERROR', message, context));
		}
	}

	fatal(message: unknown, context?: string): void {
		if (this.shouldLog('ERROR')) {
			console.error(this.fmt('FATAL', message, context));
		}
	}
}
