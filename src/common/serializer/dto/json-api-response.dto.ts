import { ApiProperty } from '@nestjs/swagger';
import { Type } from '@nestjs/common';

export class JsonApiLinksSwagger {
	@ApiProperty({ example: '/v1/products?page=2&limit=10', nullable: true })
	next!: string | null;
}

export function JsonApiSingleResponseSwaggerFor<T>(AttributesDto: Type<T>) {
	const prefix = AttributesDto.name;

	class JsonApiResourceSwagger {
		@ApiProperty({ example: 'products' })
		type!: string;

		@ApiProperty({ example: 'iphone-15' })
		id!: string;

		@ApiProperty({ type: () => AttributesDto })
		attributes!: T;
	}
	Object.defineProperty(JsonApiResourceSwagger, 'name', { value: `${prefix}SingleResourceSwagger` });

	class JsonApiSingleResponseSwagger {
		@ApiProperty({ type: () => JsonApiResourceSwagger })
		data!: InstanceType<typeof JsonApiResourceSwagger>;
	}
	Object.defineProperty(JsonApiSingleResponseSwagger, 'name', { value: `${prefix}SingleResponseSwagger` });

	return JsonApiSingleResponseSwagger;
}

export function JsonApiCollectionResponseSwaggerFor<T>(AttributesDto: Type<T>) {
	const prefix = AttributesDto.name;

	class JsonApiResourceSwagger {
		@ApiProperty({ example: 'products' })
		type!: string;

		@ApiProperty({ example: 'iphone-15' })
		id!: string;

		@ApiProperty({ type: () => AttributesDto })
		attributes!: T;
	}
	Object.defineProperty(JsonApiResourceSwagger, 'name', { value: `${prefix}CollectionResourceSwagger` });

	class JsonApiCollectionResponseSwagger {
		@ApiProperty({ type: () => [JsonApiResourceSwagger] })
		data!: InstanceType<typeof JsonApiResourceSwagger>[];

		@ApiProperty({ type: 'object', additionalProperties: true })
		meta!: Record<string, unknown>;

		@ApiProperty({ type: () => JsonApiLinksSwagger })
		links!: JsonApiLinksSwagger;
	}
	Object.defineProperty(JsonApiCollectionResponseSwagger, 'name', { value: `${prefix}CollectionResponseSwagger` });

	return JsonApiCollectionResponseSwagger;
}
