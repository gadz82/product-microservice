import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from './logger.service';

describe('LoggerService', () => {
	let service: LoggerService;

	const buildService = async (loggerLevel = 'DEBUG'): Promise<LoggerService> => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				LoggerService,
				{ provide: ConfigService, useValue: { get: (key: string) => (key === 'loggerLevel' ? loggerLevel : undefined) } }
			]
		}).compile();
		return module.get<LoggerService>(LoggerService);
	};

	beforeEach(() => {
		jest.spyOn(console, 'debug').mockImplementation(() => {});
		jest.spyOn(console, 'log').mockImplementation(() => {});
		jest.spyOn(console, 'warn').mockImplementation(() => {});
		jest.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('debug level', () => {
		beforeEach(async () => {
			service = await buildService('DEBUG');
		});

		it('should log debug messages', () => {
			service.debug('msg');
			expect(console.debug).toHaveBeenCalledWith('[DEBUG] msg');
		});

		it('should log info messages', () => {
			service.log('msg');
			expect(console.log).toHaveBeenCalledWith('[INFO] msg');
		});

		it('should log warn messages', () => {
			service.warn('msg');
			expect(console.warn).toHaveBeenCalledWith('[WARNING] msg');
		});

		it('should log error messages', () => {
			service.error('msg');
			expect(console.error).toHaveBeenCalledWith('[ERROR] msg');
		});

		it('should log verbose messages', () => {
			service.verbose('msg');
			expect(console.debug).toHaveBeenCalledWith('[VERBOSE] msg');
		});

		it('should log fatal messages', () => {
			service.fatal('msg');
			expect(console.error).toHaveBeenCalledWith('[FATAL] msg');
		});
	});

	describe('info level', () => {
		beforeEach(async () => {
			service = await buildService('INFO');
		});

		it('should not log debug messages', () => {
			service.debug('msg');
			expect(console.debug).not.toHaveBeenCalled();
		});

		it('should log info messages', () => {
			service.log('msg');
			expect(console.log).toHaveBeenCalled();
		});
	});

	describe('warning level', () => {
		beforeEach(async () => {
			service = await buildService('WARNING');
		});

		it('should not log info messages', () => {
			service.log('msg');
			expect(console.log).not.toHaveBeenCalled();
		});

		it('should log warn messages', () => {
			service.warn('msg');
			expect(console.warn).toHaveBeenCalled();
		});

		it('should log error messages', () => {
			service.error('msg');
			expect(console.error).toHaveBeenCalled();
		});
	});

	describe('error level', () => {
		beforeEach(async () => {
			service = await buildService('ERROR');
		});

		it('should not log warn messages', () => {
			service.warn('msg');
			expect(console.warn).not.toHaveBeenCalled();
		});

		it('should log error messages', () => {
			service.error('msg');
			expect(console.error).toHaveBeenCalled();
		});
	});

	describe('silent level', () => {
		beforeEach(async () => {
			service = await buildService('SILENT');
		});

		it('should not log any messages', () => {
			service.debug('msg');
			service.log('msg');
			service.warn('msg');
			service.error('msg');
			service.verbose('msg');
			service.fatal('msg');
			expect(console.debug).not.toHaveBeenCalled();
			expect(console.log).not.toHaveBeenCalled();
			expect(console.warn).not.toHaveBeenCalled();
			expect(console.error).not.toHaveBeenCalled();
		});
	});

	describe('context parameter', () => {
		beforeEach(async () => {
			service = await buildService('DEBUG');
		});

		it('should include context in log output', () => {
			service.log('msg', 'MyContext');
			expect(console.log).toHaveBeenCalledWith('[INFO] [MyContext] msg');
		});
	});

	describe('invalid LOGGER_LEVEL', () => {
		beforeEach(async () => {
			service = await buildService('INVALID');
		});

		it('should default to DEBUG and log all messages', () => {
			service.debug('msg');
			expect(console.debug).toHaveBeenCalled();
		});
	});

	describe('missing LOGGER_LEVEL', () => {
		beforeEach(async () => {
			service = await buildService(undefined);
		});

		it('should default to DEBUG when config value is undefined', () => {
			service.debug('msg');
			expect(console.debug).toHaveBeenCalled();
		});
	});
});
