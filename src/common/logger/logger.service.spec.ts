import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from './logger.service';

describe('LoggerService', () => {
	let service: LoggerService;

	const buildService = async (): Promise<LoggerService> => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [LoggerService]
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
		delete process.env.LOGGER_LEVEL;
	});

	describe('debug level', () => {
		beforeEach(async () => {
			process.env.LOGGER_LEVEL = 'DEBUG';
			service = await buildService();
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
			process.env.LOGGER_LEVEL = 'INFO';
			service = await buildService();
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
			process.env.LOGGER_LEVEL = 'WARNING';
			service = await buildService();
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
			process.env.LOGGER_LEVEL = 'ERROR';
			service = await buildService();
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
			process.env.LOGGER_LEVEL = 'SILENT';
			service = await buildService();
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
			process.env.LOGGER_LEVEL = 'DEBUG';
			service = await buildService();
		});

		it('should include context in log output', () => {
			service.log('msg', 'MyContext');
			expect(console.log).toHaveBeenCalledWith('[INFO] [MyContext] msg');
		});
	});

	describe('invalid LOGGER_LEVEL', () => {
		beforeEach(async () => {
			process.env.LOGGER_LEVEL = 'INVALID';
			service = await buildService();
		});

		it('should default to DEBUG and log all messages', () => {
			service.debug('msg');
			expect(console.debug).toHaveBeenCalled();
		});
	});

	describe('missing LOGGER_LEVEL', () => {
		beforeEach(async () => {
			delete process.env.LOGGER_LEVEL;
			service = await buildService();
		});

		it('should default to DEBUG when env var is not set', () => {
			service.debug('msg');
			expect(console.debug).toHaveBeenCalled();
		});
	});
});
