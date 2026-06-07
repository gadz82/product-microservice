# PROMPT_00: Project Scaffolding

## Status Check

Before executing, verify:
- [ ] `tsconfig.json` exists with strict mode enabled
- [ ] `src/main.ts` exists with NestJS bootstrap
- [ ] `src/app.module.ts` exists
- [ ] `.eslintrc.js` configured with tabs, printWidth 150, trailing comma none
- [ ] `.prettierrc` configured (tabs, tabWidth 4, printWidth 150, endOfLine lf, trailingComma none)
- [ ] `husky` installed with pre-commit hook running lint + format check
- [ ] `package.json` has correct NestJS dependencies

If ALL checks pass → mark as DONE. Otherwise, implement missing parts.

---

## Task

Initialize the NestJS project as a standalone microservice with strict TypeScript, ESLint, Prettier, and Husky pre-commit hooks.

## Implementation Steps

### 1. Initialize NestJS Project

```bash
npm install --save-exact @nestjs/core @nestjs/common @nestjs/platform-express reflect-metadata rxjs
npm install --save-dev --save-exact @nestjs/cli @nestjs/schematics typescript @types/node ts-node ts-loader
```

### 2. TypeScript Configuration

Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 3. ESLint Configuration

Install:
```bash
npm install --save-dev --save-exact eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier eslint-plugin-prettier
```

Create `.eslintrc.js`:
```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended'
  ],
  root: true,
  env: { node: true, jest: true },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
  }
};
```

### 4. Prettier Configuration

Create `.prettierrc`:
```json
{
  "useTabs": true,
  "tabWidth": 4,
  "printWidth": 150,
  "endOfLine": "lf",
  "trailingComma": "none",
  "singleQuote": true,
  "semi": true
}
```

### 5. Husky Pre-Commit Hook

```bash
npm install --save-dev --save-exact husky
npx husky init
```

Create `.husky/pre-commit`:
```bash
#!/usr/bin/env sh
npx prettier --check "src/**/*.ts"
npx eslint "src/**/*.ts" --max-warnings=0
```

### 6. Bootstrap Files

Create `src/main.ts`:
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
	const app = await NestFactory.create(AppModule);
	await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

Create `src/app.module.ts`:
```typescript
import { Module } from '@nestjs/common';

@Module({
	imports: [],
	controllers: [],
	providers: []
})
export class AppModule {}
```

### 7. Package.json Scripts

Add to `scripts`:
```json
{
  "build": "nest build",
  "start": "nest start",
  "start:dev": "nest start --watch",
  "lint": "eslint \"{src,test}/**/*.ts\" --max-warnings=0",
  "format": "prettier --write \"src/**/*.ts\"",
  "format:check": "prettier --check \"src/**/*.ts\""
}
```

Create `nest-cli.json`:
```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

## Validation

```bash
npx tsc --noEmit
npx eslint "src/**/*.ts" --max-warnings=0
npx prettier --check "src/**/*.ts"
```

## Commit

```bash
git add -A
git commit -m "chore(init): scaffold NestJS project with TypeScript, ESLint, Prettier, Husky"
```
