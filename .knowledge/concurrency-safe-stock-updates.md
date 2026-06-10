# Concurrency-Safe Stock Updates

## Problem

The original `updateStock` flow had a **lost-update race condition**:

```
Thread A: findByToken → stock=100 → sets stock=50 → saves
Thread B: findByToken → stock=100 → sets stock=80 → saves → A's write is LOST
```

`product.save()` issued `UPDATE SET stock=? WHERE id=?` with no version check — concurrent writes silently overwrote each other. There was also no way to atomically adjust stock by a delta (e.g. "reserve 2 units"), and no DB-level guard against negative stock.

## Solution

Two complementary strategies applied to two distinct use cases.

### 1. Optimistic Locking — `PATCH /products/:productToken`

For **absolute** stock updates ("set stock to N"), the client must acknowledge the current state before overwriting. Retry on conflict is the correct behavior.

**Changes:**

- **`product.model.ts`** — Added `version: true` to `@Table` options. Sequelize automatically:
  - Adds `WHERE version = <current>` to every `.save()`
  - Increments `version` in the `SET` clause
  - Throws `OptimisticLockError` when 0 rows match (stale instance)

- **`product-write.service.ts`** — `updateStock()` now catches `OptimisticLockError` from `product.save()` and throws `ConflictException` with message `"Product was modified concurrently. Please retry."`

- **`database-exception.filter.ts`** — Added `OptimisticLockError` mapping to 409 as defense-in-depth (catches any `OptimisticLockError` that escapes the service layer)

- **Migration `20260610090000-add-products-version-column.ts`** — Adds `version` column (INTEGER, NOT NULL, DEFAULT 1) to `products` table

### 2. Atomic Delta Adjust — `PATCH /products/:productToken/stock`

For **relative** stock adjustments ("add/subtract N units"), concurrent deltas must compose, not conflict. Retry is wrong — the delta is the intent.

**Changes:**

- **`products.repository.ts`** — New `adjustStock(token, delta)` method:
  ```sql
  UPDATE products SET stock = stock + :delta, version = version + 1
  WHERE productToken = :token AND stock + :delta >= 0
  ```
  - Atomic single query — no read-then-write race
  - `WHERE stock + delta >= 0` prevents negative stock at DB level
  - Returns `null` if 0 rows affected (product not found or underflow)
  - No need for `SELECT FOR UPDATE` since the operation is a single statement

- **`product-write.service.ts`** — New `adjustStock(token, delta)`:
  - Validates product exists (throws `NotFoundException`)
  - Returns `ConflictException("Insufficient stock...")` when repository returns `null`

- **`adjust-stock.dto.ts`** — New DTO validating `delta` is an integer (`@IsInt`, `@IsNotEmpty`)

- **`products.controller.ts`** — New endpoint:
  ```
  PATCH /v1/products/:productToken/stock
  Body: { "delta": -2 }
  ```
  Swagger-documented with 200/404/409 responses

- **`dto/index.ts`** — Added `AdjustStockDto` export

## Why Optimistic Locking over SELECT FOR UPDATE

`SELECT FOR UPDATE` (pessimistic locking) would block concurrent **readers** on the same row for the entire transaction. Product reads (listings, detail pages) vastly outnumber writes. The 409-retry pattern only hurts when conflicts are frequent, which is rare for absolute stock sets.

## Endpoint Comparison

| Endpoint | Operation | Strategy | Conflict behavior |
|----------|-----------|----------|-------------------|
| `PATCH /products/:token` | Set stock to N | Optimistic lock (version column) | 409 — client must re-read and retry |
| `PATCH /products/:token/stock` | Adjust stock by N | Atomic SQL delta | 409 only if stock would go negative |

## Test Coverage

138 tests pass (23 new), 100% statement coverage on all product module files.

New tests added:
- `updateStock` throws `ConflictException` on `OptimisticLockError`
- `updateStock` propagates non-lock errors
- `adjustStock` positive delta, negative delta, not found, stock underflow (409), DB error
- Repository `adjustStock`: atomic increment, decrement with constraint, null on underflow, positive delta omits stock constraint
- `DatabaseExceptionFilter` maps `OptimisticLockError` → 409
- `AdjustStockDto` validation: valid positive/negative, rejects float, rejects missing
- Controller `adjustStock` delegates to service and serializes