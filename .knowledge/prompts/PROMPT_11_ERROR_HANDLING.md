# PROMPT 11 — SOLID Exception Handling

## Status: ✅ DONE

## Objective
Apply SOLID principles for exception management across common and products modules:
- Single Responsibility: each filter handles one category of exceptions
- Open/Closed: new exception types extend `DatabaseExceptionFilter.mapException` without touching other code
- Liskov/Interface Segregation: filters implement `ExceptionFilter` interface
- Dependency Inversion: filters registered globally via `app.useGlobalFilters`, not hardcoded in controllers

## Changes

### New files
- `src/common/filters/http-exception.filter.ts` — catches all `HttpException`, formats consistent JSON error response with `statusCode`, `error`, `message`, `path`, `timestamp`
- `src/common/filters/database-exception.filter.ts` — catches Sequelize `BaseError` subtypes, maps to HTTP status codes:
  - `UniqueConstraintError` → 409 CONFLICT
  - `ValidationError` → 422 UNPROCESSABLE_ENTITY (joins all error messages)
  - `ForeignKeyConstraintError` → 422 UNPROCESSABLE_ENTITY
  - `ConnectionError` → 503 SERVICE_UNAVAILABLE
  - Unknown `BaseError` → 500 INTERNAL_SERVER_ERROR
- `src/common/filters/index.ts` — barrel export

### Modified files
- `src/main.ts` — registered `DatabaseExceptionFilter` and `HttpExceptionFilter` globally (DB filter first, so Sequelize errors are caught before HTTP filter)
- `src/products/repositories/products.repository.ts` — all methods wrapped in try/catch: log error with `Logger`, rethrow (except `remove` which throws `InternalServerErrorException`)

### Test files added
- `src/common/filters/http-exception.filter.spec.ts` — 4 tests
- `src/common/filters/database-exception.filter.spec.ts` — 7 tests
- `src/products/repositories/products.repository.spec.ts` — 7 new error-path tests

### Dependency added
- `@types/express` (devDependency) — required for `Request`/`Response` types in filters

## Validation
```bash
npm test
# 11 suites, 72 tests — all pass, 100% coverage all metrics
```
