# PROMPT_09: Makefile & NPM Scripts

## Status Check

Before executing, verify:
- [ ] `Makefile` exists with targets: up, down, test, unit-test, integration-test, migrate, build
- [ ] `package.json` has scripts: run-dev, build, run-unit-test, run-integration-test
- [ ] `npm run run-dev` starts Docker Compose with hot-reload
- [ ] `make up` starts the full environment
- [ ] `make down` stops the environment
- [ ] `make test` runs both unit and integration tests
- [ ] `make migrate` runs database migrations

If ALL checks pass → mark as DONE. Otherwise, implement missing parts.

---

## Task

Create a Makefile and finalize npm scripts for single-command environment management, testing, and build operations.

## Implementation Steps

### 1. Create Makefile

Create `Makefile`:
```makefile
.PHONY: up down build test unit-test integration-test migrate smoke-test logs clean

up:
	docker compose up -d
	@echo "Waiting for services to be healthy..."
	@docker compose exec mysql mysqladmin ping -h localhost --silent || sleep 5
	@echo "Environment is up."

down:
	docker compose down

build:
	npm run build

test: unit-test integration-test

unit-test:
	npm run run-unit-test

integration-test: up migrate
	@sleep 3
	npm run run-integration-test

migrate:
	npm run db:migrate

smoke-test: up migrate
	@sleep 3
	@curl -sf http://localhost:3000/products?page=1&limit=1 > /dev/null && echo "Smoke test passed" || echo "Smoke test failed"

logs:
	docker compose logs -f

clean: down
	rm -rf dist coverage node_modules

dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### 2. Finalize package.json Scripts

Ensure `package.json` scripts section contains:
```json
{
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "run-dev": "docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build",
    "run-unit-test": "jest --coverage",
    "run-integration-test": "newman run tests/integration/products.collection.json -e tests/integration/environment.json --reporters cli",
    "lint": "eslint \"{src,test}/**/*.ts\" --max-warnings=0",
    "format": "prettier --write \"src/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\"",
    "db:migrate": "npx sequelize-cli db:migrate",
    "db:migrate:undo": "npx sequelize-cli db:migrate:undo",
    "db:migration:generate": "npx sequelize-cli migration:generate --name"
  }
}
```

## Validation

```bash
# Verify Makefile targets
make -n up
make -n down
make -n test
make -n migrate

# Verify npm scripts
npm run --list
```

## Commit

```bash
git add -A
git commit -m "build(scripts): add Makefile and finalize npm scripts"
```
