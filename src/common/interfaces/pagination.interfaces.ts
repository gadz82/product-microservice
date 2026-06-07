export interface CursorPaginationOptions {
	size: number;
	after?: number;
}

export interface CursorPaginatedResult<T> {
	data: T[];
	hasNext: boolean;
	nextCursor: number | null;
}

export interface OffsetPaginationOptions {
	page: number;
	limit: number;
}

export interface OffsetPaginatedResult<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
}
