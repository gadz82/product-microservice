import { z } from 'zod';

export const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	PORT: z.coerce.number().int().positive().default(3000),
	DB_HOST: z.string().min(1),
	DB_PORT: z.coerce.number().int().positive().default(3306),
	DB_NAME: z.string().min(1),
	DB_USER: z.string().min(1),
	DB_PASSWORD: z.string().min(1)
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validate(config: Record<string, unknown>): EnvConfig {
	const result = envSchema.safeParse(config);
	if (!result.success) {
		const errors = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('\n');
		throw new Error(`Environment validation failed:\n${errors}`);
	}
	return result.data;
}
