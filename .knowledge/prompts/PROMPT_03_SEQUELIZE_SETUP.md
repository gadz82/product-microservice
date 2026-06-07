# PROMPT_03: Sequelize Setup & Database Migrations

## Status Check

Before executing, verify:
- [ ] `sequelize` and `sequelize-typescript` are installed
- [ ] `@nestjs/sequelize` is installed
- [ ] `src/database/database.module.ts` exists and configures Sequelize with ConfigService
- [ ] `.sequelizerc` exists pointing to migration/config paths
- [ ] `database/migrations/` folder exists with products table migration
- [ ] `database/config/config.js` exists for sequelize-cli
- [ ] Migration creates `products` table with columns: id, productToken, name, price, stock, createdAt, updatedAt
- [ ] `AppModule` imports `DatabaseModule`

If ALL checks pass → mark as DONE. Otherwise, implement missing parts.

---

## Task

Setup Sequelize ORM integration with NestJS and create database migrations for the products table. Schema changes must be managed exclusively via migrations.

## Implementation Steps

### 1. Install Dependencies

```bash
npm install --save-exact sequelize sequelize-typescript @nestjs/sequelize mysql2
npm install --save-dev --save-exact sequelize-cli
```

### 2. Create Sequelize CLI Config

Create `.sequelizerc`:
```javascript
const path = require('path');

module.exports = {
  config: path.resolve('database', 'config', 'config.js'),
  'migrations-path': path.resolve('database', 'migrations'),
  'seeders-path': path.resolve('database', 'seeders')
};
```

Create `database/config/config.js`:
```javascript
require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'appuser',
    password: process.env.DB_PASSWORD || 'apppassword',
    database: process.env.DB_NAME || 'ecommerce',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    dialect: 'mysql'
  },
  test: {
    username: process.env.DB_USER || 'appuser',
    password: process.env.DB_PASSWORD || 'apppassword',
    database: process.env.DB_NAME || 'ecommerce_test',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    dialect: 'mysql'
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    dialect: 'mysql'
  }
};
```

### 3. Create Products Migration

Create `database/migrations/YYYYMMDDHHMMSS-create-products-table.js` (use actual timestamp):
```javascript
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      productToken: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      stock: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('products');
  }
};
```

### 4. Create Database Module

Create `src/database/database.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';

@Module({
	imports: [
		SequelizeModule.forRootAsync({
			useFactory: (configService: ConfigService) => ({
				dialect: 'mysql',
				host: configService.get<string>('database.host'),
				port: configService.get<number>('database.port'),
				username: configService.get<string>('database.user'),
				password: configService.get<string>('database.password'),
				database: configService.get<string>('database.name'),
				autoLoadModels: true,
				synchronize: false
			}),
			inject: [ConfigService]
		})
	]
})
export class DatabaseModule {}
```

### 5. Update AppModule

Add `DatabaseModule` to imports in `src/app.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration, validate } from './config';
import { DatabaseModule } from './database/database.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
			validate
		}),
		DatabaseModule
	],
	controllers: [],
	providers: []
})
export class AppModule {}
```

### 6. Add Migration Scripts to package.json

```json
{
  "db:migrate": "npx sequelize-cli db:migrate",
  "db:migrate:undo": "npx sequelize-cli db:migrate:undo",
  "db:migration:generate": "npx sequelize-cli migration:generate --name"
}
```

## Validation

```bash
npx tsc --noEmit
npx sequelize-cli db:migrate --env development
npx sequelize-cli db:migrate:status
```

## Commit

```bash
git add -A
git commit -m "feat(database): add Sequelize setup with products table migration"
```
