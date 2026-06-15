# Case Study Review Preparation

---

## 1. 15-Minute Code Tour

### Overview (1 min)

This is a NestJS microservice for e-commerce product CRUD. Single domain module (Products), Sequelize ORM, MySQL, JSON:API responses, dual pagination. The stack is deliberately minimal: no unnecessary dependencies beyond NestJS core, Sequelize, class-validator, class-transformer, and Zod for env validation.

### Folder Structure (2 min)

```
src/
  main.ts                          # Bootstrap, global pipes, filters, Swagger, versioning
  app.module.ts                    # Root module: ConfigModule (Zod-validated), CommonModule, ProductsModule
  common/
    config/                        # Zod env validation (fail-fast on missing config)
    database/                      # Sequelize connection via ConfigService
    filters/                       # DatabaseExceptionFilter + HttpExceptionFilter
    logger/                        # Custom LoggerService with configurable levels
    pagination/                    # Offset + cursor pagination: pipe, constants, cursor utils, interfaces
    serializer/                    # Generic JSON:API serializer + Swagger DTO generators
    health/                        # Health check controller
  products/
    controllers/products.controller.ts   # 5 endpoints, delegates to read/write services
    services/
      product-read.service.ts           # CQS read side: list + findOneByToken
      product-write.service.ts          # CQS write side: create, updateStock, remove
    repositories/products.repository.ts  # Thin data access layer wrapping Sequelize model
    models/product.model.ts             # Sequelize model: id, productToken, name, price, stock
    dto/                                 # CreateProductDto, UpdateStockDto, ProductResponseDto
    serializers/products.serializer.ts   # JSON:API envelope: one()/many()/cursorLink()/offsetLink()
    interfaces/paginated-products.interface.ts
    products.module.ts                   # Wires everything together, only exports ProductReadService
database/migrations/                    # Sequelize CLI migrations
tests/integration/                      # Newman (Postman) collections for CRUD, pagination, error handling
```

### Request Flow: POST /v1/products (3 min)

```
Client
  → ValidationPipe (main.ts): whitelist, forbidNonWhitelisted, transform, stopAtFirstError
  → ProductsController.create(dto)
    → ProductWriteService.create(dto)
      → ProductsRepository.findByToken(dto.productToken)   # check-then-create pattern
      → if exists: throw ConflictException (409)
      → ProductsRepository.create(dto)                       # Sequelize Model.create
    → if create throws UniqueConstraintError → DatabaseExceptionFilter → 409
    → LoggerService.log(...)
  → ProductsSerializer.one(product)
    → JsonApiSerializer.serializeOne('products', productToken, attributes)
    → plainToInstance(ProductResponseDto, ...) with @Expose/@Exclude
  → Response: { data: { type: 'products', id: '<productToken>', attributes: { productToken, name, price, stock, createdAt, updatedAt } } }
```

### Key Decisions (3 min)

1. **CQS-lite: separate read/write services** — Keeps mutation logic isolated. The module only exports `ProductReadService`, so other modules can query products but cannot mutate them. This is not full CQRS, but it enforces a boundary: reads and writes have separate entry points, making side effects traceable.

2. **Dual pagination (offset + cursor)** — The `pt` query parameter switches between offset (`page`/`limit`) and cursor (`page[size]`/`page[after]`) pagination. Offset is simpler for random page access; cursor is stable under data mutation. The cursor is a base64-encoded internal `id`. This was a deliberate choice to show awareness of both strategies and their trade-offs.

3. **JSON:API serialization with a two-layer approach** — `ProductsSerializer` delegates the structural envelope to `JsonApiSerializer` (reusable for any future module) but handles domain-specific mapping itself (field exclusion via `ProductResponseDto`, cursor vs offset ID format). This keeps the serializer generic enough to onboard a new resource type without duplication.

### Where the Brief Was Unclear (1 min)

- **Delete**: Brief said "remove a product" without specifying soft or hard. I chose hard delete because the schema has no `deletedAt` column and the requirement said "remove from the database." A soft-delete strategy would need a `deletedAt` column, a `paranoid: true` model option, and the 410 Gone status code. I can explain why I went hard and what I would change.
- **Pagination**: Brief said "pagination" without specifying the type. I implemented both offset and cursor, gated by a `pt` query parameter, because both are common and choosing one arbitrarily felt like hiding competence.
- **Price type**: Brief said "decimal" for price. I used `DECIMAL(10,2)` at the DB level and `number` at the TS level, which is fine for storage and display. For arithmetic, you would need a library (see money precision section).

### AI Usage (1 min)

AI was used for scaffolding and boilerplate generation (DTO decorators, Swagger annotations, config wiring). Every line was reviewed, understood, and adjusted to meet the project's conventions (tabs, single quotes, no trailing commas, BDD test structure). I can defend every decision.

### Running the App and Tests

```bash
npm run quickstart          # setup + DB + migrate + dev
npm run unit-test           # Jest unit tests with coverage
npm run integration-test:all  # Newman collections (CRUD + pagination + errors)
```

---

## 2. Technical Topic Answers

### Layered Architecture

**Why this abstraction?**

Each layer has one job:
- **Controller** (`products.controller.ts`): HTTP contract — accept request, call service, serialize, return response. No business logic.
- **Service** (`product-write.service.ts`, `product-read.service.ts`): Business rules — authorize existence checks, throw domain exceptions (ConflictException, NotFoundException). No knowledge of HTTP or Sequelize.
- **Repository** (`products.repository.ts`): Data access — wraps Sequelize model calls. If I need to swap to a query builder or a different ORM, only this layer changes.
- **Serializer** (`products.serializer.ts` + `JsonApiSerializer`): Response formatting — converts domain models to JSON:API envelopes. The controller never shapes response objects.

**One concrete advantage?**

If we swap MySQL for PostgreSQL, or Sequelize for Knex, only `ProductsRepository` and the model definition change. The service, controller, and serializer are untouched. Similarly, the serializer is reusable: `JsonApiSerializer` is module-agnostic and could serialize any resource type.

**Is it overkill?**

For a single-entity CRUD service, honestly, borderline. The repository pattern adds a thin layer that could be inlined into the service when the domain is this small. But I prefer it as a default because:
1. It makes the service unit-testable with a simple mock object (no Sequelize mock setup needed in service tests).
2. It forces a single place where SQL/ORM calls live, making it easy to optimize queries later.
3. The cost is a 60-line file — not much cognitive overhead.

If I were to simplify, I would merge the repository into the service and inject the Sequelize model directly, but only if I was certain the domain would never grow beyond one entity.

### Concurrency

**"What if two identical create requests arrive at once?"**

The current code uses a check-then-create pattern: `findByToken` then `create`. This has a race condition — both requests pass the check, one insert fails on the unique constraint.

**How is it handled?**

Two safety nets are in place:
1. **Database-level unique constraint** on `productToken` (defined in the migration and model with `unique: true`). This is the real safety net. If both requests pass the check and try to insert, MySQL rejects the second with a unique constraint violation.
2. **DatabaseExceptionFilter** catches `UniqueConstraintError` from Sequelize and returns `409 Conflict` with a clear message. So the race case is handled — the second request gets a 409, not a 500.

**What about the check before insert?**

The `findByToken` check in `ProductWriteService.create` (lines 15-18) is a fast-path optimization: it returns 409 *before* hitting the database with a failed insert. This avoids the overhead of a failed insert + rollback for the common case (user retries a creation). But it's not the safety net — the unique constraint is.

**Could it be better?**

For higher concurrency assurance, I could wrap check + insert in a serializable transaction or use `SELECT ... FOR UPDATE`. But for this service scale, the unique constraint + 409 is sufficient and avoids transaction overhead.

**What about update race conditions?**

`updateStock` does a read-then-write (`findByToken` → `product.save()`). If two requests update stock simultaneously, the last write wins (no row-level locking). For a proper inventory system, I would use:
- `UPDATE products SET stock = stock + :delta WHERE productToken = :token` (relative update, not absolute)
- Or pessimistic locking (`findByToken` with `lock: true` in a transaction)
- Or optimistic locking (a `version` column with `@Version` decorator)

### Pagination

**Offset + Limit (default)**
- Query: `GET /v1/products?page=2&limit=10` (or `?pt=offset&...`)
- Implementation: `findAndCountAll` with `offset = (page - 1) * limit`
- Response includes `meta.total`, `meta.page`, `meta.limit`, `links.next`
- **Problem**: If rows are added/removed between pages, results shift — you may see duplicates or miss items on page transitions.

**Cursor**
- Query: `GET /v1/products?pt=cursor&page[size]=10&page[after]=MQ==`
- Implementation: `findAll` with `WHERE id > decodedCursor ORDER BY id ASC LIMIT size+1` (fetch one extra to determine `hasNext`)
- Cursor is base64-encoded internal `id` — opaque to the client, stable reference point
- **Advantage**: Consistent results even if data changes between requests. No skipped/duplicated items.
- **Trade-off**: No random page access — you can only go forward via the `next` link. No `total` count (would need a separate COUNT query).

**Why both?**

The brief said "pagination" without specifying. Offering both shows awareness that each has valid use cases. Offset for admin dashboards (page 3 of 10), cursor for infinite-scroll frontend feeds. The `pt` parameter makes the switch explicit.

**Cursor implementation detail** (`cursor.ts`):
- `encodeCursor(id)`: `Buffer.from(String(id)).toString('base64')` — e.g., id=5 → `NQ==`
- `decodeCursor(cursor)`: reverse, throws if not a valid number — caught as BadRequestException
- The `size + 1` trick: fetch one extra row to know if there is a next page, then slice the extra row off

### HTTP Contracts and Deletion

**Status Codes Used**

| Endpoint | Success | Not Found | Duplicate | Validation Error |
|----------|---------|-----------|-----------|------------------|
| POST /products | 201 Created | — | 409 Conflict | 400 Bad Request |
| GET /products | 200 OK | — | — | 400 (bad pagination) |
| GET /products/:token | 200 OK | 404 Not Found | — | — |
| PATCH /products/:token | 200 OK | 404 Not Found | — | 400 Bad Request |
| DELETE /products/:token | 204 No Content | 404 Not Found | — | — |

**Delete behavior**

I chose **hard delete** — `product.destroy()` removes the row. The brief said "remove a product from the database," which I interpreted literally. The response is 204 No Content on success, 404 if the product doesn't exist.

**The 204-for-any-delete idempotency question**

Some argue that `DELETE /products/:token` should return 204 regardless of whether the resource existed (idempotent = same result every time). I chose to return 404 for a missing resource because:
1. It gives the client useful information (the thing you tried to delete never existed).
2. DELETE idempotency means *making the same request twice has the same effect*, not that the response must be identical. After the first DELETE, the resource is gone. The second DELETE correctly tells the client "there's nothing here."
3. This is consistent with how I handle GET and PATCH — they all return 404 for a missing token.

If the requirement were to return 204 always, I would change `remove` to do a `findOne` + `destroy` only if found, or use `destroy({ where: { productToken } })` and check the affected row count.

**410 Gone**

Not implemented. 410 implies the client should know the resource existed and was intentionally removed (soft delete). Since I do hard deletes and don't track removed tokens, I can't distinguish "never existed" from "was deleted." If I added soft deletes (`deletedAt` column + `paranoid: true`), I could return 410 for a soft-deleted resource and 404 for one that never existed.

**Docs, tests, and code alignment**

All three agree:
- Integration tests assert exact status codes (201, 200, 204, 409, 404, 400).
- Swagger annotations on the controller document expected responses.
- The `HttpExceptionFilter` and `DatabaseExceptionFilter` produce a consistent error envelope: `{ statusCode, error, message, path, timestamp }`.
- In production, `disableErrorMessages: true` on the ValidationPipe suppresses details; the filter replaces `message` with the HTTP status label (e.g., `BAD_REQUEST`).

### Money Precision

**Problem**

JavaScript `number` is a 64-bit float. `0.1 + 0.2 !== 0.3` — it's `0.30000000000000004`. For a products catalog, this is acceptable for *display* (the model stores `DECIMAL(10,2)` in MySQL), but unacceptable for *arithmetic* (calculating totals, applying discounts).

**Current approach**

- **Database**: `price` is `DECIMAL(10,2)` — MySQL stores and computes this as an exact decimal, not a float.
- **Sequelize model**: `DataType.DECIMAL(10, 2)` — Sequelize returns `DECIMAL` values as *strings* by default (not JS numbers), which avoids float precision loss.
- **Model declaration**: `declare price: number` — this tells TypeScript it's a number, but at runtime Sequelize gives us a string for DECIMAL columns.

**The gap**

The `class-transformer` serialization via `plainToInstance(ProductResponseDto, ...)` with `transform: true` in the ValidationPipe coerces the price to a JS number. So the API response may show `9.99` correctly (since 2-decimal-place values are generally representable), but if we ever did arithmetic on prices in the service layer, we'd have a precision problem.

**Strong answer on money**

For a real e-commerce system:
1. Store and receive prices as *strings* in the API (e.g., `"price": "9.99"`), not numbers.
2. Use a library like `decimal.js`, `bignumber.js`, or `dinero.js` for any arithmetic on the server.
3. Keep `DECIMAL(10,2)` at the database level — it's exact storage.
4. Never do `price * quantity` with JS floats. Either do it in the DB query or use the library.

In this project, the price is stored and retrieved without modification — no arithmetic is performed. So float precision is not an issue *yet*. If we added cart/order logic, I would change the DTO to accept/return price as a string and use a decimal library for any calculations.

### Transactions

**Current usage**

None. No explicit Sequelize transactions are used anywhere in the codebase. Each operation is a single DB call (or a read + write sequence that doesn't need atomicity in isolation).

**When would I add transactions?**

1. **Create with related entities**: If creating a product also needed to create inventory records or audit log entries, I'd wrap those in a transaction so all succeed or all roll back.
2. **Read-then-write with consistency requirement**: The current `create` (check if exists → insert) would benefit from a serializable transaction if we needed to guarantee no duplicate inserts at the application level. But since the unique constraint handles this, a transaction would reduce the race window but not eliminate it without serializable isolation.
3. **Bulk operations**: If we added a batch import endpoint running multiple inserts, wrapping them in a transaction prevents partial imports.

**Cost**

Opening and committing a transaction adds round-trips. For a single `INSERT`, it's unnecessary overhead. Under heavy load where every query runs in a transaction (especially with row-level locking), it adds up: connections stay open longer, reducing the pool. I haven't measured this — I would use transactions only where correctness demands it and measure the impact.

**Why no transaction on read?**

`findOneByToken` and `list` are simple reads. A single `SELECT` is inherently atomic. Adding a transaction would add overhead for no benefit. Transactions on reads matter when a later query depends on an earlier one and data could change between them (e.g., read balance → check → debit). That pattern doesn't exist here.

### Testing

**Unit Tests** (`*.spec.ts` alongside source files)

Coverage:
- **Controller**: Delegates to services and serializer. Tests verify correct delegation and serialization — no business logic in the controller.
- **ProductWriteService**: Tests for create (unique token → Conflict, otherwise create), updateStock (not found → NotFound, otherwise update), remove (not found → NotFound, otherwise destroy). Also tests DB error propagation.
- **ProductReadService**: Tests for list (offset defaults, cursor decoding, invalid cursor → BadRequest), findOneByToken (found/not found/DB error).
- **ProductsRepository**: All methods tested with a mock Sequelize model (create, findByToken, findById, findAll cursor, findAllOffset, updateStock, remove, plus error propagation for each).
- **ProductsSerializer**: Tests JSON:API format (type, id, attributes), field exclusion (no `id` in attributes), cursor ID encoding, link generation.
- **DatabaseExceptionFilter**: Maps each Sequelize error type to the correct HTTP status (UniqueConstraint → 409, ValidationError → 422, ForeignKey → 422, Connection → 503, unknown → 500).
- **HttpExceptionFilter**: Tests string messages, object messages, error labels, and production mode (generic status label instead of details).
- **DTO Validation**: Tests field constraints (maxLength, min/max, type) for CreateProductDto and UpdateStockDto.

**Integration Tests** (Newman/Postman collections)

- **CRUD collection**: Create → List → Get → Update Stock → Delete → Get Deleted (404). Validates JSON:API format, status codes, field presence/absence.
- **Pagination collection**: Create 2 products → Default offset → Explicit offset → Page 2 → Cursor → Cursor next page → Invalid pt (400) → Teardown deletes.
- **Error Handling collection**: 409 duplicate token, 400 missing fields, 400 invalid types, 400 negative values, 404 get/update/delete non-existent, 400 invalid pagination type, 400 non-integer page param.

**How tests wire a real database**

Integration tests run against a real MySQL instance (Docker Compose `docker-compose.dev.yml`). The same NestJS modules run in test, local, and cloud — config is injected via environment variables and validated at startup by Zod. The app does not start if any required env var is missing. The `quickstart` script sets up the entire environment: `npm ci` → Docker up → migrate → start dev.

**What's not tested**

- E2E tests with supertest (the Newman collections cover the same ground at the HTTP level).
- Concurrency/race condition tests (would need a load testing tool like k6 or Artillery).
- The database migration itself (tested manually via `npm run db:migrate`).
- Edge cases around very large datasets for pagination.

---

## 3. Self-Review: Weak Points and AI Usage

### Where I Added Layers and Why

| Layer | Concrete Benefit |
|-------|-----------------|
| Repository | Service tests mock a 5-method object instead of setting up Sequelize. DB swap path is clear. |
| Read/Write services | CQS-lite: module only exports read service. Write operations are encapsulated. |
| Serializer (2 layers) | `JsonApiSerializer` is reusable. `ProductsSerializer` handles domain mapping. |
| Pagination module | `pt` pipe validates input. Cursor encode/decode is centralized. Adding a third pagination type is one file. |
| Exception filters | Two filters: one for HTTP (handles Nest exceptions), one for DB (catches Sequelize errors that bypass the HTTP layer). |

### What Breaks Under Load

| Path | Risk |
|------|------|
| `create` | Race condition on check-then-create. Unique constraint is the safety net. |
| `updateStock` | Last-write-wins. No locking. For real inventory: use relative updates or pessimistic locking. |
| `findAll` (offset) | Large offsets cause MySQL to scan and discard rows. Cursor pagination avoids this. |
| `findAll` (cursor) | Stable and efficient, but no total count. Adding COUNT would be a separate query. |

### Where I Cut Corners

1. **No transactions** — every operation is single-statement. Safe for CRUD, insufficient for multi-table writes.
2. **No soft delete** — hard delete only. No `deletedAt`, no 410 Gone.
3. **Price as number in TypeScript** — fine for storage/display, not for arithmetic. Would switch to string + decimal library for transaction logic.
4. **Cursor is just base64(id)** — opaque to the client but trivially decodable. Not a security risk (you still need `WHERE id > X`), but worth noting in a security review.
5. **No rate limiting** — the service has no throttling. Would add `@nestjs/throttler` for production.
6. **No authentication** — all endpoints are public. Would add a guard/JWT layer.
7. **No API versioning beyond URI** — `v1` in the path. Versioning strategy would need expansion for `v2`.

### AI Usage

AI assisted with:
- Generating boilerplate: DTO decorators, Swagger annotations, NestJS module wiring.
- Scaffolding test structures (describe/it blocks).
- Generating the Newman integration test collections from endpoint specs.

Every line was reviewed and adjusted. I can walk through any file and explain each decision.

---

## 4. Follow-Up Ladder Drills

### Drill: Layered Architecture

1. **"Walk me through this."** Controller → Service → Repository. Controller handles HTTP, service handles business rules, repository handles data access. Serializer formats the response.
2. **"What if the service needs to call two repositories?"** That's fine — the service orchestrates. It's the coordinator. If it gets complex, extract a use-case/application service.
3. **"How would you fix the repository-service coupling?"** Currently the service depends on the concrete repository class. I could extract an interface (`IProductsRepository`) and inject it. NestJS makes this easy with custom providers.
4. **"What's the trade-off?"** More interfaces mean more files and more indirection. For one entity, it's marginal. For a domain with many bounded contexts, it allows swapping implementations (e.g., in-memory repo for testing).

### Drill: Concurrency

1. **"Walk me through the create flow."** Service checks if token exists → if yes, throw 409 → if no, call repository create → return product.
2. **"What if two identical requests arrive at once?"** Both pass the check, both try to insert. The second fails on the unique constraint. The `DatabaseExceptionFilter` catches the `UniqueConstraintError` and returns 409. No 500.
3. **"How would you fix the race?"** Option A: Wrap check+insert in a serializable transaction. Option B: Skip the check entirely and rely on the unique constraint + catch. Option C: Use `INSERT ... ON CONFLICT` (MySQL's `ON DUPLICATE KEY`) at the SQL level. I'd pick option B — it's the simplest and already handles the case.
4. **"What's the trade-off?"** Option B means every duplicate creation attempt hits the DB and fails. The check saves a DB round-trip for the common case but adds one for all cases. Under low contention, the check is an optimization. Under high contention, it's a false safety net.

### Drill: Delete Behavior

1. **"Walk me through delete."** Find product by token → 404 if missing → call `product.destroy()` → return 204 No Content.
2. **"What if someone deletes the same product twice?"** First request succeeds (204). Second request hits 404 because the row is gone. This is correct — the resource no longer exists.
3. **"Some APIs return 204 for any DELETE, even if the resource didn't exist. Why didn't you?"** I chose 404 for consistency: GET, PATCH, and DELETE all return 404 for a missing token. The client always knows whether the resource existed. If the spec required "204 always," I'd use `destroy({ where: { productToken } })` and check `affectedRows`.
4. **"What's the trade-off?"** 204-for-any-delete caches better (idempotent response) and saves a DB query. 404-for-missing is more informative. I'd pick based on what the frontend needs.

### Drill: Pagination

1. **"Walk me through cursor pagination."** Client sends `?pt=cursor&page[size]=10&page[after]=MQ==`. Controller parses type via pipe. Service decodes cursor (base64 → id). Repository queries `WHERE id > 5 ORDER BY id ASC LIMIT 11` (one extra to check `hasNext`). Serializer encodes the last ID as the next cursor.
2. **"What if data is inserted between pages?"** Cursor pagination is stable — new items get IDs higher than the cursor, so they appear on later pages. No duplicates, no skipped items. This is the main advantage over offset pagination.
3. **"How would you add backward pagination?"** Add a `page[before]` parameter and query `WHERE id < cursor ORDER BY id DESC LIMIT size+1`, then reverse the result. Requires storing the cursor for both directions.
4. **"What's the trade-off with cursor vs offset?"** Cursor is consistent but no random page access. Offset allows "go to page 5" but drifts under mutation. Cursor doesn't need a COUNT query for total. Offset gives total but at higher cost on large datasets.

### Drill: Money Precision

1. **"Walk me through how price is stored and returned."** MySQL stores it as `DECIMAL(10,2)` — exact. Sequelize returns it as a string by default. ValidationPipe's `transform: true` coerces it to a number. The API returns it as a JSON number.
2. **"What's the risk?"** JavaScript float. `0.1 + 0.2` is `0.30000000000000004`. For this service, price is only stored and retrieved — no arithmetic — so it's fine. But if we calculated totals, we'd lose precision.
3. **"How would you fix it?"** Three changes: (a) accept price as a string in the DTO (`@IsString()`), (b) store as `DECIMAL(10,2)` (already done), (c) return as a string in the response DTO, (d) use `decimal.js` or `bignumber.js` for any server-side arithmetic.
4. **"What's the trade-off?"** Strings are less ergonomic for clients (can't do `price * quantity` in frontend JS either). A common compromise: store as DECIMAL, return as string, and let the client use a decimal library if needed. The key is: never do financial arithmetic with JS floats anywhere in the stack.

### Drill: Error Handling

1. **"Walk me through what happens when validation fails."** `ValidationPipe` catches the error before the controller. It returns 400 with the first validation message (in dev) or just `BAD_REQUEST` (in prod, because `disableErrorMessages: true`).
2. **"What about a DB unique constraint violation?"** If the application-level check in the service doesn't catch it, the DB rejects the insert. Sequelize throws `UniqueConstraintError`. The `DatabaseExceptionFilter` catches it and returns 409 Conflict.
3. **"What if the DB is down?"** Sequelize throws `ConnectionError`. `DatabaseExceptionFilter` maps it to 503 Service Unavailable.
4. **"What leaks in production?"** Very little. The `HttpExceptionFilter` replaces detailed messages with HTTP status labels in production. The `DatabaseExceptionFilter` always returns a safe generic message. The `ValidationPipe` with `disableErrorMessages` hides validation details.

### Drill: Testing Strategy

1. **"Walk me through your test approach."** Three layers: unit tests (Jest, mock dependencies, test each class in isolation), integration tests (Newman/Postman collections against a real running server with a real MySQL database), and CI pipeline (runs both).
2. **"Why Newman and not supertest?"** Newman tests the full HTTP stack including network, serialization, and error formats — no NestJS test module needed. It also tests the exact contract the client sees. Supertest would test inside the process, which is faster but less realistic.
3. **"What's missing?"** Concurrency tests, performance/benchmark tests, edge-case DB failure tests, and end-to-end tests that verify the Docker container startup and health checks.
4. **"How would you add concurrency tests?"** Use a load testing tool (k6, Artillery) to send simultaneous create requests with the same productToken and assert 201 + 409. Or write a Jest test that fires two concurrent HTTP requests and checks the responses.

---

## 5. Quick Reference: Key File Locations

| Concern | File |
|---------|------|
| Bootstrap (pipes, filters, Swagger) | `src/main.ts` |
| Env validation (Zod) | `src/common/config/env.validation.ts` |
| DB connection | `src/common/database/database.module.ts` |
| Migration | `database/migrations/20260607090000-create-products-table.ts` |
| Controller | `src/products/controllers/products.controller.ts` |
| Write service (create, updateStock, remove) | `src/products/services/product-write.service.ts` |
| Read service (list, findOne) | `src/products/services/product-read.service.ts` |
| Repository | `src/products/repositories/products.repository.ts` |
| Model | `src/products/models/product.model.ts` |
| DTOs (validation) | `src/products/dto/` |
| JSON:API serializer | `src/products/serializers/products.serializer.ts` |
| Generic serializer | `src/common/serializer/services/json-api.serializer.ts` |
| Pagination (cursor encode/decode) | `src/common/pagination/utils/cursor.ts` |
| Pagination type pipe | `src/common/pagination/pipes/parse-pagination-type.pipe.ts` |
| DB exception filter | `src/common/filters/database-exception.filter.ts` |
| HTTP exception filter | `src/common/filters/http-exception.filter.ts` |
| Integration tests | `tests/integration/*.collection.json` |

---

## 6. One-Liners for Quick Recall

- **Architecture**: Controller → Service → Repository. Serializer for output. No business logic in controller.
- **CQS**: WriteService handles mutations. ReadService handles queries. Module only exports ReadService.
- **Create concurrency**: Check-then-create is a fast path. Unique constraint + 409 is the safety net.
- **Pagination**: `pt=offset` for random access, `pt=cursor` for stable iteration. `size+1` trick for `hasNext`.
- **JSON:API**: `data.type`, `data.id` (productToken for offset, base64(id) for cursor), `data.attributes` (no raw `id`).
- **Money**: `DECIMAL(10,2)` in MySQL, stored/retrieved as-is. No arithmetic. Would switch to string + decimal.js for transactions.
- **Delete**: Hard delete, 204 on success, 404 if missing. No soft delete, no 410.
- **Error filter**: Dev shows details. Prod shows `HttpStatus[label]` only.
- **Transactions**: None currently. Single-statement CRUD doesn't need them. Would add for multi-table operations.
- **Testing**: Jest unit tests mock all dependencies. Newman integration tests hit real HTTP + MySQL.