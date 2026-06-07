export const PAGINATION_DEFAULTS = {
	PAGE: 1,
	LIMIT: 10,
	SIZE: 10,
	TYPE: 'ol' as const
} as const;

export const PAGINATION_TYPES = ['ol', 'cursor'] as const;
