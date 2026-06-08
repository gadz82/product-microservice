import { ApiProperty } from '@nestjs/swagger';

export class JsonApiResourceSwagger {
	@ApiProperty({ example: 'products' })
	type!: string;

	@ApiProperty({ example: 'iphone-15' })
	id!: string;

	@ApiProperty({ type: 'object', additionalProperties: true })
	attributes!: Record<string, unknown>;
}

export class JsonApiSingleResponseSwagger {
	@ApiProperty({ type: JsonApiResourceSwagger })
	data!: JsonApiResourceSwagger;
}

export class JsonApiLinksSwagger {
	@ApiProperty({ example: '/products?page=2&limit=10', nullable: true })
	next!: string | null;
}

export class JsonApiCollectionResponseSwagger {
	@ApiProperty({ type: [JsonApiResourceSwagger] })
	data!: JsonApiResourceSwagger[];

	@ApiProperty({ type: 'object', additionalProperties: true })
	meta!: Record<string, unknown>;

	@ApiProperty({ type: JsonApiLinksSwagger })
	links!: JsonApiLinksSwagger;
}
