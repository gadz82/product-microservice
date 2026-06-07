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
	meta: { hasNext: boolean };
	links: { next: string | null };
}

export function serializeOne(type: string, id: number, attributes: Record<string, unknown>, fields?: string[]): JsonApiSingleResponse {
	const filtered = fields ? pickFields(attributes, fields) : attributes;
	return { data: { type, id: String(id), attributes: filtered } };
}

export function serializeMany(
	type: string,
	items: { id: number; [key: string]: unknown }[],
	meta: { hasNext: boolean },
	links: { next: string | null },
	fields?: string[]
): JsonApiCollectionResponse {
	const data = items.map((item) => {
		const { id, ...rest } = item;
		const attributes = fields ? pickFields(rest, fields) : rest;
		return { type, id: String(id), attributes };
	});
	return { data, meta, links };
}

function pickFields(obj: Record<string, unknown>, fields: string[]): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const field of fields) {
		if (field in obj) result[field] = obj[field];
	}
	return result;
}
