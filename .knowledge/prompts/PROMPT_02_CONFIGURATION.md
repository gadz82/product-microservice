# PROMPT_02: Configuration & Environment Validation

## Status Check

Before executing, verify:
- [ ] `@nestjs/config` is installed
- [ ] `zod` is installed
- [ ] `src/config/env.validation.ts` exists with Zod schema validating all env vars
- [ ] `src/config/configuration.ts` exports typed configuration
- [ ] `AppModule` imports `ConfigModule.forRoot()` with validation
- [ ] App fails fast on startup if env vars are missing/invalid

If ALL checks pass → mark as DONE. Otherwise, implement missing parts.

---

## Task

Implement runtime environment validation using `@nestjs/config` + Zod. The application must fail-fast with clear error messages if required configuration is missing or invalid.

## Implementation Steps

### 1. Install Dependencies

```bash
npm install --save-exact @nestjs/config zod
```

### 2. Create Zod Environment Schema

Create `src/config/env.validation.ts`:
```typescript
import { z } from 'zod';

export const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	PORT: z.coerce.number().int().positive().default(3000),
	DB_HOST: z.string().min(1),
	DB_PORT: z.coerce.number().int().positive().default(3306),
	DB_NAME: z.string().min(1),
	DB_USER: z.string().min(1),
	DB_PASSWORD: z.string().min(1),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validate(config: Record<string, unknown>): EnvConfig {
	const result = envSchema.safeParse(config);
	if (!result.success) {
		const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('\n');
		throw new Error(`Environment validation failed:\n${errors}`);
	}
	return result.data;
}
```

### 3. Create Configuration Factory

Create `src/config/configuration.ts`:
```typescript
export default () => ({
	port: parseInt(process.env.PORT ?? '3000', 10),
	database: {
		host: process.env.DB_HOST,
		port: parseInt(process.env.DB_PORT ?? '3306', 10),
		name: process.env.DB_NAME,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD
	},
});
```

### 4. Create Config Module Index

Create `src/config/index.ts`:
```typescript
export { validate, envSchema, EnvConfig } from './env.validation';
export { default as configuration } from './configuration';
```

### 5. Update AppModule

Update `src/app.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration, validate } from './config';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
			validate
		})
	],
	controllers: [],
	providers: []
})
export class AppModule {}
```

### 6. Update main.ts to Use ConfigService

Update `src/main.ts`:
```typescript
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
	const app = await NestFactory.create(AppModule);
	const configService = app.get(ConfigService);
	const port = configService.get<number>('port', 3000);
	await app.listen(port);
}
bootstrap();
```

## Validation

```bash
# Should fail with clear error (no .env present):
npx ts-node -e "import { validate } from './src/config'; validate({})" 2>&1 | grep "Environment validation failed"

# Should pass with proper env:
cp .env.example .env
npx tsc --noEmit
```

## Commit

```bash
git add -A
git commit -m "feat(config): add environment validation with Zod and @nestjs/config"
```
