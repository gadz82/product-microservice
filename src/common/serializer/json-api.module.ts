import { Module } from '@nestjs/common';
import { JsonApiSerializer } from './services/json-api.serializer';

@Module({
	providers: [JsonApiSerializer],
	exports: [JsonApiSerializer]
})
export class JsonApiModule {}
