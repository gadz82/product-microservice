# PROMPT 12 — Error Handling Integration Tests (Newman)

## Goal
Extend Newman integration tests to cover all managed exceptions from the SOLID exception handling architecture introduced in PROMPT_11.

## Produced Files
- `tests/integration/error-handling.collection.json` — dedicated Newman collection
- `package.json` — added `run-integration-test:errors` script
- `Makefile` — wired errors collection into `integration-test` and `full-test` targets

## Collection Structure (13 items)

| # | Name | Method | Expected Status |
|---|------|--------|----------------|
| 1 | Setup: Create product for error tests | POST /v1/products | 201 |
| 2 | 409 Conflict: Duplicate productToken | POST /v1/products | 409 |
| 3 | 400 Bad Request: Missing required fields | POST /v1/products | 400 |
| 4 | 400 Bad Request: Invalid field types | POST /v1/products | 400 |
| 5 | 400 Bad Request: Negative price and stock | POST /v1/products | 400 |
| 6 | 404 Not Found: Get non-existent product | GET /v1/products/:token | 404 |
| 7 | 404 Not Found: Update stock of non-existent product | PATCH /v1/products/:token/stock | 404 |
| 8 | 404 Not Found: Delete non-existent product | DELETE /v1/products/:token | 404 |
| 9 | 400 Bad Request: Update stock with invalid body | PATCH /v1/products/:token/stock | 400 |
| 10 | 400 Bad Request: Update stock with negative value | PATCH /v1/products/:token/stock | 400 |
| 11 | 400 Bad Request: Invalid pagination type | GET /v1/products?pt=invalid | 400 |
| 12 | 400 Bad Request: Invalid page param (non-integer) | GET /v1/products?page=abc | 400 |
| 13 | Teardown: Delete product created for error tests | DELETE /v1/products/:token | 204 |

## Error Response Shape Verified
Every error test asserts the consistent JSON shape from the exception filters:
```json
{
  "statusCode": <number>,
  "error": "<string>",
  "message": "<string|array>",
  "path": "<string>",
  "timestamp": "<string>"
}
```

## Exception Coverage Matrix

| Exception | Filter | HTTP Code | Test # |
|-----------|--------|-----------|--------|
| ConflictException (duplicate token) | HttpExceptionFilter | 409 | 2 |
| ValidationPipe (missing fields) | HttpExceptionFilter | 400 | 3 |
| ValidationPipe (wrong types) | HttpExceptionFilter | 400 | 4 |
| ValidationPipe (negative values) | HttpExceptionFilter | 400 | 5 |
| NotFoundException (get) | HttpExceptionFilter | 404 | 6 |
| NotFoundException (update) | HttpExceptionFilter | 404 | 7 |
| NotFoundException (delete) | HttpExceptionFilter | 404 | 8 |
| ValidationPipe (stock body) | HttpExceptionFilter | 400 | 9, 10 |
| BadRequestException (pagination pipe) | HttpExceptionFilter | 400 | 11 |
| ParseIntPipe (page param) | HttpExceptionFilter | 400 | 12 |
