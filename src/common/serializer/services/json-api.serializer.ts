import { Injectable } from '@nestjs/common';
import { JsonApiResource, JsonApiSingleResponse, JsonApiCollectionResponse } from '../interfaces/json-api.interface';

@Injectable()
export class JsonApiSerializer {
	serializeOne(type: string, id: string, attributes: Record<string, unknown>): JsonApiSingleResponse {
		return { data: { type, id, attributes } };
	}

	serializeMany(
		type: string,
		items: { id: string; attributes: Record<string, unknown> }[],
		meta: Record<string, unknown>,
		links: { next: string | null }
	): JsonApiCollectionResponse {
		const data = items.map((item) => ({ type, id: item.id, attributes: item.attributes }));
		return { data, meta, links };
	}
}
