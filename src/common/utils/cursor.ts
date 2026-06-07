export function encodeCursor(id: number): string {
	return Buffer.from(String(id)).toString('base64');
}

export function decodeCursor(cursor: string): number {
	const decoded = Buffer.from(cursor, 'base64').toString('utf8');
	const id = parseInt(decoded, 10);
	if (isNaN(id)) throw new Error('Invalid cursor');
	return id;
}
