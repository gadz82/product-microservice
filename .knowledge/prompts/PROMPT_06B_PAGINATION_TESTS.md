# PROMPT_06B: Newman Pagination Integration Tests

## Status Check

Before executing, verify:
- [ ] `tests/integration/pagination.collection.json` exists
- [ ] Tests cover offset-limit pagination (default, `pt=ol`)
- [ ] Tests cover cursor-based pagination (`pt=cursor`)
- [ ] Tests cover invalid `pt` value (400 response)
- [ ] Tests verify JSON:API meta fields differ per pagination type
- [ ] `npm run run-integration-test:pagination` script exists

If ALL checks pass → mark as DONE. Otherwise, implement missing parts.

---

## Task

Create Newman integration tests specifically for pagination behavior, validating both modes and parameter validation.

## Implementation Steps

### 1. Create Pagination Collection

Create `tests/integration/pagination.collection.json`:
```json
{
  "info": {
    "name": "Products Pagination",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Setup - Create Product 1",
      "event": [{ "listen": "test", "script": { "exec": ["pm.test('Created', () => pm.response.to.have.status(201));"] } }],
      "request": {
        "method": "POST",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": { "mode": "raw", "raw": "{\"name\": \"Pagination A\", \"productToken\": \"pag-tok-a\", \"price\": 10, \"stock\": 5}" },
        "url": { "raw": "{{baseUrl}}/products", "host": ["{{baseUrl}}"], "path": ["products"] }
      }
    },
    {
      "name": "Setup - Create Product 2",
      "event": [{ "listen": "test", "script": { "exec": ["pm.test('Created', () => pm.response.to.have.status(201));"] } }],
      "request": {
        "method": "POST",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": { "mode": "raw", "raw": "{\"name\": \"Pagination B\", \"productToken\": \"pag-tok-b\", \"price\": 20, \"stock\": 10}" },
        "url": { "raw": "{{baseUrl}}/products", "host": ["{{baseUrl}}"], "path": ["products"] }
      }
    },
    {
      "name": "Offset-Limit Default (no pt)",
      "event": [{ "listen": "test", "script": { "exec": [
        "pm.test('Status is 200', () => pm.response.to.have.status(200));",
        "const json = pm.response.json();",
        "pm.test('Has data array', () => pm.expect(json.data).to.be.an('array'));",
        "pm.test('Meta has total', () => pm.expect(json.meta.total).to.be.a('number'));",
        "pm.test('Meta has page', () => pm.expect(json.meta.page).to.be.a('number'));",
        "pm.test('Meta has limit', () => pm.expect(json.meta.limit).to.be.a('number'));"
      ] } }],
      "request": {
        "method": "GET",
        "url": { "raw": "{{baseUrl}}/products?page=1&limit=10", "host": ["{{baseUrl}}"], "path": ["products"], "query": [{ "key": "page", "value": "1" }, { "key": "limit", "value": "10" }] }
      }
    },
    {
      "name": "Offset-Limit Explicit (pt=ol)",
      "event": [{ "listen": "test", "script": { "exec": [
        "pm.test('Status is 200', () => pm.response.to.have.status(200));",
        "const json = pm.response.json();",
        "pm.test('Meta has total', () => pm.expect(json.meta.total).to.be.a('number'));",
        "pm.test('Meta has page', () => pm.expect(json.meta.page).to.eql(1));"
      ] } }],
      "request": {
        "method": "GET",
        "url": { "raw": "{{baseUrl}}/products?pt=ol&page=1&limit=1", "host": ["{{baseUrl}}"], "path": ["products"], "query": [{ "key": "pt", "value": "ol" }, { "key": "page", "value": "1" }, { "key": "limit", "value": "1" }] }
      }
    },
    {
      "name": "Offset-Limit Page 2",
      "event": [{ "listen": "test", "script": { "exec": [
        "pm.test('Status is 200', () => pm.response.to.have.status(200));",
        "const json = pm.response.json();",
        "pm.test('Page is 2', () => pm.expect(json.meta.page).to.eql(2));",
        "pm.test('Has data', () => pm.expect(json.data).to.be.an('array'));"
      ] } }],
      "request": {
        "method": "GET",
        "url": { "raw": "{{baseUrl}}/products?pt=ol&page=2&limit=1", "host": ["{{baseUrl}}"], "path": ["products"], "query": [{ "key": "pt", "value": "ol" }, { "key": "page", "value": "2" }, { "key": "limit", "value": "1" }] }
      }
    },
    {
      "name": "Cursor Pagination",
      "event": [{ "listen": "test", "script": { "exec": [
        "pm.test('Status is 200', () => pm.response.to.have.status(200));",
        "const json = pm.response.json();",
        "pm.test('Has data array', () => pm.expect(json.data).to.be.an('array'));",
        "pm.test('Meta has hasNext', () => pm.expect(json.meta).to.have.property('hasNext'));",
        "pm.test('Meta does NOT have total', () => pm.expect(json.meta).to.not.have.property('total'));",
        "pm.test('Links has next', () => pm.expect(json.links).to.have.property('next'));",
        "if (json.data.length > 0) { pm.collectionVariables.set('firstCursor', json.data[json.data.length - 1].id); }"
      ] } }],
      "request": {
        "method": "GET",
        "url": { "raw": "{{baseUrl}}/products?pt=cursor&page[size]=1", "host": ["{{baseUrl}}"], "path": ["products"], "query": [{ "key": "pt", "value": "cursor" }, { "key": "page[size]", "value": "1" }] }
      }
    },
    {
      "name": "Cursor Pagination - Next Page",
      "event": [{ "listen": "test", "script": { "exec": [
        "pm.test('Status is 200', () => pm.response.to.have.status(200));",
        "const json = pm.response.json();",
        "pm.test('Returns data', () => pm.expect(json.data).to.be.an('array'));",
        "pm.test('Data has items', () => pm.expect(json.data.length).to.be.greaterThan(0));"
      ] } }],
      "request": {
        "method": "GET",
        "url": { "raw": "{{baseUrl}}/products?pt=cursor&page[size]=1&page[after]={{firstCursor}}", "host": ["{{baseUrl}}"], "path": ["products"], "query": [{ "key": "pt", "value": "cursor" }, { "key": "page[size]", "value": "1" }, { "key": "page[after]", "value": "{{firstCursor}}" }] }
      }
    },
    {
      "name": "Invalid pt value (400)",
      "event": [{ "listen": "test", "script": { "exec": [
        "pm.test('Status is 400', () => pm.response.to.have.status(400));",
        "pm.test('Error message mentions pt', () => pm.expect(pm.response.json().message).to.include('pagination type'));"
      ] } }],
      "request": {
        "method": "GET",
        "url": { "raw": "{{baseUrl}}/products?pt=invalid", "host": ["{{baseUrl}}"], "path": ["products"], "query": [{ "key": "pt", "value": "invalid" }] }
      }
    }
  ],
  "variable": [
    { "key": "firstCursor", "value": "" }
  ]
}
```

### 2. Add Script to package.json

```json
{
  "run-integration-test:pagination": "newman run tests/integration/pagination.collection.json -e tests/integration/environment.json --reporters cli"
}
```

## Validation

```bash
docker compose up -d
npm run db:migrate
npm run run-integration-test:pagination
docker compose down
```

## Commit

```bash
git add -A
git commit -m "test(integration): add Newman pagination tests for offset-limit and cursor modes"
```
