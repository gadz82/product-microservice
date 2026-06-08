import { Controller, Get, VERSION_NEUTRAL, Version } from '@nestjs/common';
import { ApiOkResponse, ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('health')
export class HealthController {
	@Get()
	@Version(VERSION_NEUTRAL)
	@ApiOkResponse({ schema: { example: { status: 'ok' } } })
	check(): { status: string } {
		return { status: 'ok' };
	}
}
