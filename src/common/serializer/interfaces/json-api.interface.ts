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
