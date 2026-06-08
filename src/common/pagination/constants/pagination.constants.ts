export const PAGINATION_DEFAULTS = {
	PAGE: 1,
	LIMIT: 10,
	SIZE: 10,
	TYPE: 'offset' as const,
	CURSOR_TYPE: 'cursor' as const
} as const;

export const PAGINATION_TYPES = ['offset', 'cursor'] as const;
