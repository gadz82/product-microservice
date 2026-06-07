# PROMPT_06: Integration Tests (Newman/Postman)

## Status Check

Before executing, verify:
- [ ] `newman` is installed as dev dependency
- [ ] `tests/integration/products.collection.json` exists (Postman collection)
- [ ] `tests/integration/environment.json` exists with base URL config
- [ ] Collection tests cover: Create, List, Get, Update Stock, Delete
- [ ] Collection includes test assertions (status codes, response body)
- [ ] `npm run run-integration-test` script works

If ALL checks pass → mark as DONE. Otherwise, implement missing parts.

---

## Task

Create Postman/Newman integration tests that validate all CRUD endpoints against a running instance. Tests must be executable via CLI.

## Implementation Steps

### 1. Install Dependencies

```bash
npm install --save-dev --save-exact newman
```

### 2. Create Postman Environment

Create `tests/integration/environment.json`:
```json
{
  "id": "products-env",
  "name": "Products Local",
  "values": [
    { "key": "baseUrl", "value": "http://localhost:3000", "enabled": true },
    { "key": "productId", "value": "", "enabled": true },
    { "key": "productToken", "value": "", "enabled": true }
  ]
}
```

### 3. Create Postman Collection

Create `tests/integration/products.collection.json`:
```json
{
  "info": {
    "name": "Products CRUD",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create Product",
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test('Status is 201', () => pm.response.to.have.status(201));",
              "pm.test('Has id', () => pm.expect(pm.response.json().id).to.be.a('number'));",
              "pm.test('Has productToken', () => pm.expect(pm.response.json().productToken).to.eql('int-test-token'));",
              "pm.collectionVariables.set('productId', pm.response.json().id);"
            ]
          }
        }
      ],
      "request": {
        "method": "POST",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": {
          "mode": "raw",
          "raw": "{\"name\": \"Integration Widget\", \"productToken\": \"int-test-token\", \"price\": 19.99, \"stock\": 50}"
        },
        "url": { "raw": "{{baseUrl}}/products", "host": ["{{baseUrl}}"], "path": ["products"] }
      }
    },
    {
      "name": "List Products",
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test('Status is 200', () => pm.response.to.have.status(200));",
              "pm.test('Has data array', () => pm.expect(pm.response.json().data).to.be.an('array'));",
              "pm.test('Has pagination fields', () => { const json = pm.response.json(); pm.expect(json.total).to.be.a('number'); pm.expect(json.page).to.be.a('number'); });"
            ]
          }
        }
      ],
      "request": {
        "method": "GET",
        "url": { "raw": "{{baseUrl}}/products?page=1&limit=10", "host": ["{{baseUrl}}"], "path": ["products"], "query": [{ "key": "page", "value": "1" }, { "key": "limit", "value": "10" }] }
      }
    },
    {
      "name": "Get Product",
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test('Status is 200', () => pm.response.to.have.status(200));",
              "pm.test('Correct product returned', () => pm.expect(pm.response.json().productToken).to.eql('int-test-token'));"
            ]
          }
        }
      ],
      "request": {
        "method": "GET",
        "url": { "raw": "{{baseUrl}}/products/{{productId}}", "host": ["{{baseUrl}}"], "path": ["products", "{{productId}}"] }
      }
    },
    {
      "name": "Update Stock",
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test('Status is 200', () => pm.response.to.have.status(200));",
              "pm.test('Stock updated', () => pm.expect(pm.response.json().stock).to.eql(75));"
            ]
          }
        }
      ],
      "request": {
        "method": "PATCH",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": { "mode": "raw", "raw": "{\"stock\": 75}" },
        "url": { "raw": "{{baseUrl}}/products/{{productId}}/stock", "host": ["{{baseUrl}}"], "path": ["products", "{{productId}}", "stock"] }
      }
    },
    {
      "name": "Delete Product",
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test('Status is 204', () => pm.response.to.have.status(204));"
            ]
          }
        }
      ],
      "request": {
        "method": "DELETE",
        "url": { "raw": "{{baseUrl}}/products/{{productId}}", "host": ["{{baseUrl}}"], "path": ["products", "{{productId}}"] }
      }
    },
    {
      "name": "Get Deleted Product (404)",
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test('Status is 404', () => pm.response.to.have.status(404));"
            ]
          }
        }
      ],
      "request": {
        "method": "GET",
        "url": { "raw": "{{baseUrl}}/products/{{productId}}", "host": ["{{baseUrl}}"], "path": ["products", "{{productId}}"] }
      }
    }
  ],
  "variable": [
    { "key": "productId", "value": "" }
  ]
}
```

### 4. Add Script to package.json

```json
{
  "run-integration-test": "newman run tests/integration/products.collection.json -e tests/integration/environment.json --reporters cli"
}
```

## Validation

```bash
# Start the app + database first
docker compose up -d
npm run db:migrate
npm run run-integration-test
docker compose down
```

## Commit

```bash
git add -A
git commit -m "test(integration): add Newman collection for products CRUD integration tests"
```
