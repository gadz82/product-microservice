---
name: product-nest-onboarding
description: >
  Your opinionated co-pilot for the product-nest microservice. Designed for humans (and their AI sidekicks)
  joining the project — answers "how do I...?", "where is...?", "why did he...?", and "what was he thinking?"
  Covers architecture, running, testing, CI, conventions, JSON:API guts, pagination, Docker, migrations, and all
  the tribal knowledge you'd normally pester a senior dev for. Invoke explicitly or match dev queries about the project.
license: MIT
metadata:
  author: gadz82
  version: "1.1.0"
---

# product-nest onboarding

Welcome aboard. This skill is the tribal knowledge dump — everything you'd learn in your first week, compressed into one file. No fluff, no hand-holding, just the stuff that matters.

## When to Apply

- "How do I run this thing?"
- "Where is X implemented?"
- "Why does the response look like that?"
- "What's the commit format again?"
- "How does pagination work here?"
- "Is the DB in Docker or local?"
- "Why is this env var failing silently?"
- "How do I add a new field to products?"
- Any dev question about this codebase

If someone's asking about product-nest internals, this skill fires.

---

## The 60-Second Orientation

You just cloned `product-nest`. Here's what you're looking at:

| What | TL;DR |
|------|-------|
| **What is this?** | NestJS 11 microservice managing e-commerce products — CRUD + pagination |
| **What runs it?** | TypeScript 6 (strict) + Sequelize ORM + MySQL 8.0 + Docker |
| **How does it talk?** | JSON:API responses, URI versioned (`/v1/products`) |
| **How do I start?** | `npm run quickstart` — one command, full dev environment |
| **How do I test?** | `npm run unit-test` for Jest, `npm run integration-test:all` for Newman |
| **How do I commit?** | `type(scope): description` — Commitlint blocks anything else |
| **Where's the spec?** | `.knowledge/` — the immutable source of truth for everything |

---

## Source Map — Where Everything Lives

```
src/
├── main.ts                          # Bootstrap: global pipes, filters, swagger, versioning
├── app.module.ts                    # Root module — ConfigModule.forRoot (Zod) + CommonModule + ProductsModule
├── common/                          # Shared infrastructure (reusable across modules)
│   ├── common.module.ts             # Wires DB, logger, health, pagination, serializer
│   ├── config/
│   │   ├── configuration.ts         # Env vars → typed config object
│   │   ├── env.validation.ts        # Zod schema — app REFUSES to start if env invalid
│   │   └── env.validation.spec.ts   # Tests for env validation
│   ├── database/                    # Sequelize connection setup
│   ├── filters/
│   │   ├── database-exception.filter.ts  # Sequelize errors → HTTP (e.g. UniqueConstraint → 409)
│   │   └── http-exception.filter.ts       # Prod: status label only. Dev: full detail
│   ├── health/                      # Health check controller
│   ├── logger/                      # Custom LoggerService wrapping NestJS logger
│   ├── pagination/
│   │   ├── constants/               # PAGINATION_DEFAULTS (offset type, page 1, limit 10, cursor size 10)
│   │   ├── interfaces/              # PaginationType union, PaginationMeta
│   │   ├── pipes/                   # ParsePaginationTypePipe — validates `pt` query param
│   │   └── utils/                   # Offset/cursor link builders
│   └── serializer/
│       ├── dto/                     # JsonApiSingleResponseDto, JsonApiCollectionResponseDto, Swagger variants
│       ├── interfaces/              # Serializer contracts
│       ├── services/                # JsonApiSerializerService — domain → JSON:API
│       └── json-api.module.ts       # Shared module exporting serializer
├── products/                        # The one domain module — everything product-related
│   ├── products.module.ts           # Imports[SequelizeModule.forFeature, CommonModule]
│   ├── controllers/
│   │   └── products.controller.ts   # 5 endpoints, all Swagger-decorated
│   ├── dto/
│   │   ├── create-product.dto.ts    # name, productToken, price, stock — class-validator rules
│   │   ├── update-stock.dto.ts      # stock only (PATCH absolute set)
│   │   ├── adjust-stock.dto.ts      # delta (integer) — for atomic stock adjustment
│   │   ├── product-response.dto.ts  # Swagger response shape
│   │   └── index.ts                # Barrel export
│   ├── interfaces/
│   │   └── paginated-products.interface.ts
│   ├── models/
│   │   └── product.model.ts        # Sequelize model: id(PK, auto), productToken(unique), name, price(dec), stock(int)
│   ├── repositories/
│   │   └── products.repository.ts  # Data access — services never touch Sequelize directly
│   ├── serializers/
│   │   └── products.serializer.ts  # Product[] → JSON:API (one, many, links, meta)
│   ├── services/
│   │   ├── product-read.service.ts  # GET findAll, findOneByToken — queries only
│   │   └── product-write.service.ts # POST create, PATCH updateStock, DELETE remove — mutations only
│   └── AGENTS.md                    # Module-level AI context
├── export-swagger.ts                # `npm run export-swagger` → openapi.json

database/
├── config/config.js                 # Sequelize CLI connection config (reads .env)
└── migrations/                      # Schema DDL — the ONLY way schema changes happen

tests/
└── integration/
    ├── products.collection.json      # Newman: CRUD happy path + conflict/not-found
    ├── pagination.collection.json   # Newman: offset + cursor pagination scenarios
    ├── error-handling.collection.json # Newman: validation, 404, 409, method not allowed
    └── stock-adjust.collection.json    # Newman: delta stock adjustment + concurrency scenarios

.knowledge/                          # IMMUTABLE TRUTH — assessment.md + tech specs + execution prompts
```

---

## Endpoints — The Contract

| Method | Path | What | Status |
|--------|------|------|--------|
| POST | `/v1/products` | Create product | 201 |
| GET | `/v1/products` | List (dual pagination) | 200 |
| GET | `/v1/products/:productToken` | Get single | 200 / 404 |
| PATCH | `/v1/products/:productToken`           | Set stock to absolute value (optimistic lock)     | 200 / 404 / 409 |
| PATCH | `/v1/products/:productToken/stock`    | Adjust stock by delta (atomic, concurrent-safe)    | 200 / 404 / 409 |
| DELETE | `/v1/products/:productToken` | Remove | 204 / 404 |

### Create — request body

```json
{ "name": "Widget", "productToken": "widget-001", "price": 9.99, "stock": 100 }
```

### JSON:API Response — Single

```json
{
  "data": {
    "type": "products",
    "id": "widget-001",
    "attributes": {
      "productToken": "widget-001",
      "name": "Widget",
      "price": 9.99,
      "stock": 100,
      "createdAt": "2026-06-08T12:00:00.000Z",
      "updatedAt": "2026-06-08T12:00:00.000Z"
    }
  }
}
```

**Key gotcha**: `data.id` = `productToken` (JSON:API resource identifier). `productToken` also appears in `attributes` for GET responses but is excluded from POST/PATCH responses — that's intentional.

### JSON:API Response — Collection

```json
{
  "data": [...],
  "meta": { "totalCount": 50, "hasNext": true, "page": 2, "limit": 10 },
  "links": { "self": "/v1/products?pt=offset&page=2&limit=10", "next": "/v1/products?pt=offset&page=3&limit=10" }
}
```

The `links` and `meta` shape changes based on pagination type. The serializer handles all of it — you don't build JSON:API by hand.

---

## Pagination — Two Flavors

The `pt` query param selects the strategy. Default is `offset`.

### Offset (classic page/limit)

```
GET /v1/products?page=1&limit=10
GET /v1/products?pt=offset&page=2&limit=10
```

Meta includes `totalCount`, `hasNext`, `page`, `limit`. Links include `self` and `next` (when applicable).

### Cursor (for large datasets)

```
GET /v1/products?pt=cursor&page[size]=10
GET /v1/products?pt=cursor&page[size]=10&page[after]=MQ==
```

Meta includes `totalCount`, `hasNext`. `page[after]` = base64-encoded cursor. Links include `self` and `next` (when applicable).

Defaults: offset page=1, limit=10, cursor size=10. See `src/common/pagination/constants/`.

---

## Error Handling — Dev vs Prod

This is deliberate and documented. Not a bug — a feature.

| Environment | What you get |
|------------|-------------|
| `NODE_ENV=development` | Specific validation error message (first error only — `stopAtFirstError: true`) |
| `NODE_ENV=production` | HTTP status label only. `"BAD_REQUEST"`. Nothing else. No stack, no detail, no hint. |

Two global filters handle this:

- **`HttpExceptionFilter`** (`src/common/filters/http-exception.filter.ts`) — Nest exceptions → JSON responses. Dev mode includes messages; prod mode strips them.
- **`DatabaseExceptionFilter`** (`src/common/filters/database-exception.filter.ts`) — Sequelize errors → HTTP. `UniqueConstraintError` → 409, `OptimisticLockError` → 409, etc.

---

## Record Locking & Concurrency Strategies

Two distinct stock update endpoints use **different** locking strategies — pick the right one for your use case.

### The Problem

Without locking, concurrent stock writes silently overwrite each other (lost-update race):

```
Thread A: read stock=100 → sets stock=50  → save
Thread B: read stock=100 → sets stock=80  → save  ← A's write LOST
```

A naive `UPDATE SET stock=? WHERE id=?` has no version check.

### Strategy 1 — Optimistic Locking: `PATCH /products/:productToken`

For **absolute** stock sets ("set stock to 50"), the client must acknowledge current state before overwriting. Retry on conflict is the correct behavior.

- **How**: Sequelize `version: true` on the model (`@Table` option). Every `.save()` adds `WHERE version = <current>` and auto-increments `version`. If 0 rows match → `OptimisticLockError` → 409 `"Product was modified concurrently. Please retry."`
- **File**: `product.model.ts:3` — `@Table({ tableName: 'products', timestamps: true, version: true })`
- **File**: `product-write.service.ts:36-38` — catches `OptimisticLockError` in `updateStock()`
- **File**: `database-exception.filter.ts:29-31` — defense-in-depth mapping of any uncaught `OptimisticLockError` → 409
- **Migration**: `20260610090000-add-products-version-column.ts` — adds `version` INTEGER column

### Strategy 2 — Atomic Delta: `PATCH /products/:productToken/stock`

For **relative** adjustments ("subtract 2 units"), concurrent deltas must compose, not conflict. Retry is wrong — the delta *is* the intent.

- **How**: A single atomic SQL statement, no read-then-write:
  ```sql
  UPDATE products SET stock = stock + :delta, version = version + 1
  WHERE productToken = :token AND stock + :delta >= 0
  ```
  - `WHERE stock + delta >= 0` prevents negative stock at DB level
  - Returns 0 affected rows if product not found or stock underflow
  - No `SELECT FOR UPDATE` needed — single statement is already atomic in InnoDB
- **File**: `products.repository.ts:57-65` — `adjustStock(token, delta)` method
- **File**: `product-write.service.ts:43-53` — `adjustStock()` validates existence, returns 409 on underflow
- **DTO**: `adjust-stock.dto.ts` — `{ delta: -2 }`, validates integer with `@IsInt`

### Lock Mode Support in `findByToken`

The repository's `findByToken` accepts an optional Sequelize `LOCK` parameter (`products.repository.ts:16`):

```ts
async findByToken(token: string, lock: LOCK | undefined = undefined): Promise<Product | null> {
  return this.productModel.findOne({ where: { productToken: token }, lock });
}
```

Pass `LOCK.UPDATE` or `LOCK.SHARE` for `SELECT ... FOR UPDATE` / `SELECT ... LOCK IN SHARE MODE` when you need pessimistic row-level locking in a transaction. Not used by default — callers opt in explicitly.

### Why Optimistic over Pessimistic (SELECT FOR UPDATE)?

`SELECT FOR UPDATE` blocks concurrent **readers** on the same row for the entire transaction. Product reads (listings, detail pages) vastly outnumber writes. The 409-retry pattern only hurts when conflicts are frequent — rare for absolute stock sets. Optimistic locking keeps reads fast and undelayed.

### Endpoint Locking Summary

| Endpoint | Operation | Strategy | Conflict? |
|----------|-----------|----------|-----------|
| `PATCH /v1/products/:token` | Set stock to N | Optimistic lock (version column) | 409 — re-read + retry |
| `PATCH /v1/products/:token/stock` | Adjust stock by N | Atomic SQL delta | 409 — only if stock would go negative |

---

## Architecture Decisions — The "Why"

### CQS Lite (Command-Query Separation)

`ProductReadService` and `ProductWriteService` are separate classes. Reads don't mutate. Mutations don't return complex query results. This isn't full CQRS — no event sourcing — but it keeps read logic (pagination, filtering) clean from write side-effects (create, update, delete, cache invalidation).

**`ProductsModule` only exports `ProductReadService`.** WriteService stays internal. External modules can query products but can't mutate them without going through the controller. Design choice, not accident.

### Repository Pattern

Services call `ProductsRepository`, not Sequelize directly. Repository wraps all data access — queries, creates, updates, deletes. If you need to swap ORM or add caching, you change one file. Services stay clean.

### JSON:API Serializer

Controllers don't format responses. They return domain objects, and `ProductsSerializer` maps them to JSON:API. One method for single resources, one for collections with pagination meta/links. Keep the controller thin.

### Global ValidationPipe

Configured in `main.ts` with:
- `whitelist: true` — strips unknown properties
- `forbidNonWhitelisted: true` — rejects extra fields with 400
- `transform: true` — auto-converts types
- `stopAtFirstError: true` — one error at a time, not a flood

Don't bypass it. Every endpoint uses DTOs with `class-validator` decorators.

### Zod Env Validation

`@nestjs/config` `validate` function uses Zod. If any required env var is missing or invalid, the app **refuses to start**. No silent defaults. No mysterious runtime crashes. Check `.env.example` for the full list.

---

## Running It — Every Way

### Quickstart (the one-liner)

```bash
npm run quickstart
```

This does: `npm ci` → Husky init → MySQL Docker → sleep 10 → migrate → `nest start --watch`. You're up on `:3000`.

### Manual (step by step)

```bash
npm run setup              # npm ci + Husky
cp .env.example .env       # Configure env vars
docker compose -f docker-compose.dev.yml up -d  # MySQL only
npm run db:migrate          # Run Sequelize migrations
npm run start:dev           # Nest watch mode
```

### Production-like

```bash
docker compose up --build  # MySQL + app in containers
```

### Makefile Shortcuts

| Make target | What happens |
|-------------|-------------|
| `make install` | `npm run setup` |
| `make dev` | MySQL docker → build → migrate → watch |
| `make up` | install → build → docker compose up |
| `make down` | docker compose down -v |
| `make build` | install → nest build |
| `make test` | unit-test + integration-test |
| `make unit-test` | Jest + coverage |
| `make integration-test` | smoke test → Newman CRUD + errors |
| `make full-test` | down → install → build → unit → smoke → all integration |
| `make smoke-test` | build → unit → up → migrate → curl health |
| `make swagger` | install → build → export openapi.json |
| `make clean` | down → remove dist/ coverage/ node_modules/ |

---

## Environment Variables

| Var | Default | Required? | Zod validated? |
|-----|---------|-----------|---------------|
| `NODE_ENV` | `development` | Yes | Yes |
| `PORT` / `APP_PORT` | `3000` | Yes | Yes |
| `LOGGER_LEVEL` | `DEBUG` | No | Yes |
| `DB_HOST` | `mysql` | Yes | Yes |
| `DB_PORT` | `3306` | Yes | Yes |
| `DB_NAME` | `ecommerce` | Yes | Yes |
| `DB_USER` | `appuser` | Yes | Yes |
| `DB_PASSWORD` | `apppassword` | Yes | Yes |
| `DB_ROOT_PASSWORD` | `rootpassword` | Yes | Yes |
| `DB_LOGGING` | `false` | No | Yes |

**All validated at startup.** Missing or invalid = crash. Intentional fail-fast. Copy `.env.example` → `.env` and go.

---

## Database — Migrations Only

No `synchronize: true` in prod. Schema changes go through Sequelize CLI migrations only.

```bash
npm run db:migrate                    # Run pending migrations
npm run db:migrate:undo               # Rollback last migration
npm run db:migration:generate -- --name add_columns  # Generate new migration
```

### The `products` table

| Column | Type | Constraints |
|--------|------|------------|
| `id` | INTEGER | AUTO_INCREMENT, PK |
| `productToken` | VARCHAR(255) | UNIQUE, NOT NULL |
| `name` | VARCHAR(255) | NOT NULL |
| `price` | DECIMAL(10,2) | NOT NULL |
| `stock` | INTEGER | NOT NULL |
| `version` | INTEGER | NOT NULL, DEFAULT 0 |

`id` never leaves the DB — never exposed in API responses. `productToken` is the external identifier and JSON:API `id`.

---

## Docker — Two Compose Files

| File | What runs | When to use |
|------|-----------|------------|
| `docker-compose.dev.yml` | MySQL only | Local dev — app runs on host with `nest start --watch` |
| `docker-compose.yml` | MySQL + app | Production-like testing, CI |

Both use MySQL 8.0 with healthchecks. Prod compose waits for MySQL to be healthy before starting the app.

### Dockerfile

Multi-stage: `builder` stage runs `npm ci` + `nest build`, `production` stage runs `npm ci --omit=dev --ignore-scripts` + copies `dist/`. Result: lean image, no dev deps in production.

---

## Testing — Unit + Integration

| Command | What it does |
|---------|-------------|
| `npm run unit-test` | Jest with coverage → `coverage/` |
| `npm run integration-test` | Newman: products CRUD collection |
| `npm run integration-test:pagination` | Newman: pagination collection |
| `npm run integration-test:errors` | Newman: error handling collection |
| `npm run integration-test:all` | All three Newman collections |
| `make smoke-test` | Build → unit test → docker up → migrate → curl health check |

### Unit Test Conventions

- BDD nested `describe`: outer = Class name, inner = method name, `it` = specific branch/edge-case
- Mock Sequelize repository in service tests — no real DB
- Co-located `*.spec.ts` files next to source
- Coverage threshold enforced; check `jest.config.js`

### Integration Tests

Newman runs Postman collections against a live server. You need MySQL running + migrations applied + app on `:3000`. `make smoke-test` handles setup for you.

---

## Code Style — No Negotiation

| Rule | Value | Enforced by |
|------|-------|-------------|
| Indentation | Tabs, 4 width | Prettier + ESLint |
| Print width | 150 | Prettier |
| End of line | LF | Prettier + ESLint |
| Trailing comma | None | Prettier |
| Quotes | Single | Prettier |
| Semicolons | Yes | ESLint |
| Comments | Minimal, brief, critical logic only | Code review |
| Unused vars | Error (prefix `_` to ignore) | ESLint `@typescript-eslint/no-unused-vars` |
| Explicit return types | Warn | ESLint `@typescript-eslint/explicit-function-return-type` |
| Max warnings | 0 — zero tolerance | ESLint CLI flag |

**Pre-commit hook** (`npm run format:check && npm run lint`) — blocks commit on any violation.

**Commit-msg hook** — Commitlint enforces Conventional Commits format.

Don't fight the hooks. They're right.

---

## Git & Commits — Conventional or Nothing

```
type(scope): description
```

| Rule | Detail |
|------|--------|
| Types | feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert |
| Scope | Lower-case, describes module/area |
| Subject | Max 72 chars, no sentence/title/pascal/upper case |
| Body | Optional, for context |

Examples:
- `feat(products): add cursor pagination`
- `fix(pagination): encode cursor as base64`
- `ci(github): add integration test service container`

**Semantic Release** runs on `main` branch merges. Don't manually bump versions.

**Branching**: Gitflow. `feature/* → develop → release/* → main`.

---

## CI/CD — Dual Platform

GitLab CI (`.gitlab-ci.yml`) + GitHub Actions (`.github/workflows/ci.yml`). Both run the same stages:

| Stage | What | Fails on |
|-------|------|----------|
| install | `npm ci`, cache node_modules | Dependency resolution |
| audit | `npm audit --audit-level=critical` | Critical vulnerability |
| build | `npm run build`, verify `dist/main.js` exists | Compilation |
| unit-test | Jest + cobertura coverage | Test failure or coverage dip |
| integration-test | MySQL container → migrate → start app → Newman | Endpoint contract |
| sast | ESLint `--max-warnings=0` | Any warning |
| deploy | `semantic-release --dry-run` (main only) | — |

**Deploy stage** only runs on `main`. It computes the next version but doesn't publish. Real deployment = future milestone.

**Local CI**: `gitlab-ci-local` for running GitLab pipeline locally.

---

## JSON:API Internals — How It's Built

The serializer layer (`src/common/serializer/` + `src/products/serializers/`) is the bridge between domain objects and wire format.

### Serializer Architecture

```
Controller
  → Service (returns plain Product | PaginatedProducts)
    → ProductsSerializer.one(product)          → JsonApiSingleResponse
    → ProductsSerializer.many(products, meta, links, pt)  → JsonApiCollectionResponse
```

`JsonApiSerializerService` (in common) handles the generic JSON:API envelope. `ProductsSerializer` (in products) knows about the `products` type and `productToken` id mapping.

### Key Rules

1. `data.type` = always `"products"`
2. `data.id` = always `productToken` (never the auto-increment `id`)
3. `data.attributes` includes `productToken` for GET, excluded for POST/PATCH responses
4. `data.attributes` never includes `id`
5. `meta` and `links` generated by serializer based on pagination type

---

## Knowledge Base — The Source of Truth

```
.knowledge/
├── AGENTS.md                  ← Execution protocol (how to work)
├── assessment.md              ← Domain contract (WHAT to build)
├── technical_requirements.md  ← Engineering contract (HOW to build)
└── prompts/
    ├── EXECUTION_MATRIX.md    ← Dependency graph + status tracking
    └── PROMPT_00..12          ← Idempotent implementation steps
```

Every prompt is **idempotent**: check state → implement if needed → validate → commit. You can resume from any prompt at any time. The matrix tracks progress.

If you're confused about *why* something is the way it is, check `assessment.md` (domain) or `technical_requirements.md` (engineering). They override everything.

---

## Swagger / OpenAPI

Interactive docs at `http://localhost:3000/api/docs` when running.

Export to JSON:

```bash
make swagger
# or
npm run export-swagger
```

Import `openapi.json` into Postman for a ready-made collection.

---

## Common "Why?" Questions

**Why is `productToken` in both `data.id` and `data.attributes`?**
JSON:API spec requires `id` as the resource identifier. We expose the business key (`productToken`) there. For GET convenience, it also lives in `attributes`. For POST/PATCH, it's excluded from `attributes` since the client already sent it.

**Why CQS instead of CQRS?**
Full CQRS (separate read/write stores, event sourcing) is overkill for a CRUD microservice. CQS gives us the separation benefit (clean read/write paths) without the infra complexity. If the service grows to need eventual consistency, the architecture supports evolving toward CQRS.

**Why Zod for env validation instead of Joi?**
Zod provides better TypeScript inference. The validated config object is fully typed — if you access `configService.get('db.host')`, TypeScript knows it's a string. No `as string` casts needed.

**Why `stopAtFirstError` on ValidationPipe?**
One error at a time. Easier for consumers to fix. Easier to debug. No error explosion.

**Why is `ProductWriteService` not exported from `ProductsModule`?**
Encapsulation. External modules can read products through `ProductReadService` but can't mutate them without going through the HTTP controller (which enforces validation, serialization, etc.). If we need internal mutation later, we add a specific use-case method, not a blanket export.

**Why not `synchronize: true`?**
Migrations are the only way schema changes happen. `synchronize` in production can silently alter tables, drop columns, and corrupt data. We're professionals here.

**Why two compose files?**
`dev` runs only MySQL — your app runs locally with hot reload and instant feedback. `prod` runs the whole stack in Docker — for CI and realistic testing.

---

## Quick Troubleshooting

| Problem | Fix |
|---------|-----|
| MySQL connection refused | `docker compose ps` — wait for healthcheck. `make down && make dev` |
| Port 3000 in use | Change `APP_PORT` in `.env` |
| Migrations fail | Check `.env` matches `database/config/config.js`. `make clean && make dev` |
| Integration tests fail | App must be running on `:3000` first. `make smoke-test` handles this |
| Env validation crash | Compare `.env` against `.env.example`. Zod will tell you exactly what's wrong |
| Commit blocked | `npm run format` then `npm run lint`. Fix errors. Check commit message format |
| Swagger not loading | App must be running. Visit `http://localhost:3000/api/docs` |
