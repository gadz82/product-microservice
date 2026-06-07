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

export function serializeOne(type: string, id: number, attributes: Record<string, unknown>): JsonApiSingleResponse {
	return { data: { type, id: String(id), attributes } };
}

export function serializeMany(
	type: string,
	items: { id: number; [key: string]: unknown }[],
	meta: Record<string, unknown>,
	links: { next: string | null }
): JsonApiCollectionResponse {
	const data = items.map((item) => {
		const { id, ...attributes } = item;
		return { type, id: String(id), attributes };
	});
	return { data, meta, links };
}
