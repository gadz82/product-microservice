export interface JsonApiResource {
	type: string;
	id: string;
	attributes: Record<string, unknown>;
}

export interface JsonApiSingleResponse {
	data: JsonApiResource;
}

export interface JsonApiCollectionResponse {
	data: JsonApiResource[];
	meta: Record<string, unknown>;
	links: { next: string | null };
}

export function serializeOne(type: string, id: string, attributes: Record<string, unknown>): JsonApiSingleResponse {
	return { data: { type, id, attributes } };
}

export function serializeMany(
	type: string,
	items: { id: string; attributes: Record<string, unknown> }[],
	meta: Record<string, unknown>,
	links: { next: string | null }
): JsonApiCollectionResponse {
	const data = items.map((item) => ({ type, id: item.id, attributes: item.attributes }));
	return { data, meta, links };
}
