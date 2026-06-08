# Products Service

NestJS microservice for e-commerce product management. Provides CRUD operations for products using Sequelize ORM and MySQL, following JSON:API response conventions.

## Prerequisites

| Tool    | Version  |
|---------|----------|
| Node.js | >= 22    |
| npm     | latest   |
| Docker  | 20+      |
| Docker Compose | 2+ |

## Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd product-nest

# 2. Install dependencies and initialize hooks
npm run setup

# 3. Copy environment configuration
cp .env.example .env

# 4. Start the development environment (MySQL + hot-reload app)
npm run quickstart
```

The API will be available at `http://localhost:3000`.

## Environment Setup

### Environment Variables

Copy `.env.example` to `.env` and adjust values as needed:

| Variable          | Default       | Description                    |
|-------------------|---------------|--------------------------------|
| `NODE_ENV`        | `development` | Runtime environment            |
| `PORT`            | `3000`        | Application port               |
| `APP_PORT`        | `3000`        | Host port mapping (Docker)     |
| `DB_HOST`         | `mysql`       | Database host                  |
| `DB_PORT`         | `3306`        | Database port                  |
| `DB_NAME`         | `ecommerce`   | Database name                  |
| `DB_USER`         | `appuser`     | Database user                  |
| `DB_PASSWORD`     | `apppassword` | Database password              |
| `DB_ROOT_PASSWORD`| `rootpassword`| MySQL root password            |
| `LOGGER_LEVEL`    | `INFO`        | Log level (SILENT, ERROR, INFO, DEBUG) |

### Database Migrations

After starting MySQL, run migrations to create the schema:

```bash
npm run db:migrate
```

To undo the last migration:

```bash
npm run db:migrate:undo
```

To generate a new migration:

```bash
npm run db:migration:generate <migration-name>
```

## Running the Application

### Development Mode (Hot Reload)

Runs the app with file watching. Requires MySQL to be running (handled by the compose stack):

```bash
npm run run-dev
```

This starts MySQL via `docker-compose.dev.yml` and runs NestJS in watch mode.

### Production Build

```bash
# Compile TypeScript
npm run build

# Start the compiled application
npm run start
```

### Docker Compose (Full Stack)

Runs both MySQL and the application in containers:

```bash
docker compose up --build
```

The app waits for MySQL healthcheck before starting.

## Makefile Commands

For convenience, a `Makefile` provides shortcuts for common operations:

| Command              | Description                                    |
|----------------------|------------------------------------------------|
| `make install`       | Install dependencies and setup Husky hooks     |
| `make dev`           | Start dev environment (MySQL + hot-reload app) |
| `make up`            | Start Docker Compose services                  |
| `make down`          | Stop and remove Docker Compose services        |
| `make build`         | Install deps and compile TypeScript            |
| `make migrate`       | Install, build, start services, run migrations |
| `make test`          | Run unit and integration tests                 |
| `make unit-test`     | Run Jest unit tests                            |
| `make integration-test` | Run Newman integration tests               |
| `make smoke-test`    | Quick end-to-end validation                    |
| `make full-test`     | Clean slate: down, install, build, test all    |
| `make logs`          | Follow Docker Compose logs                     |
| `make clean`         | Stop services and remove dist/coverage/node_modules |
| `make swagger`       | Export Swagger/OpenAPI documentation           |

## API Endpoints

| Method   | Endpoint                        | Description                          |
|----------|---------------------------------|--------------------------------------|
| `POST`   | `/products`                     | Create a new product                 |
| `GET`    | `/products`                     | List products (paginated)            |
| `GET`    | `/products/:productToken`       | Get a specific product               |
| `PATCH`  | `/products/:productToken`       | Update product (stock)               |
| `DELETE` | `/products/:productToken`       | Remove a product                     |

### Request Body (Create)

```json
{
  "name": "Product Name",
  "productToken": "unique-token-123",
  "price": 29.99,
  "stock": 100
}
```

### Response Format (JSON:API)

```json
{
  "data": {
    "type": "product",
    "id": "unique-token-123",
    "attributes": {
      "productToken": "unique-token-123",
      "name": "Product Name",
      "price": 29.99,
      "stock": 100
    }
  }
}
```

### Pagination

The list endpoint supports multiple pagination styles:

| Parameter      | Description                    |
|----------------|--------------------------------|
| `page`         | Page number (1-based)          |
| `limit`        | Items per page                 |
| `pt`           | Product token filter           |
| `page[size]`   | Cursor pagination size         |
| `page[after]`  | Cursor pagination offset token |

## Testing

### Unit Tests

```bash
npm run unit-test
```

Runs Jest with coverage output. Reports are generated in `coverage/`.

### Integration Tests

```bash
# Full suite (CRUD + pagination + error handling)
npm run integration-test:all

# Individual collections
npm run integration-test           # CRUD operations
npm run integration-test:pagination # Pagination endpoints
npm run integration-test:errors    # Error handling scenarios
```

Integration tests use Newman to execute Postman-style collections against a running instance. Requires MySQL to be running and migrations applied.

### Smoke Test

Quick validation that the app boots and responds:

```bash
make smoke-test
```

## Code Quality

### Linting

```bash
# Check for lint errors (zero warnings allowed)
npm run lint

# Auto-fix formatting
npm run format

# Check formatting without modifying files
npm run format:check
```

### Git Hooks

Husky enforces the following on every commit:

- **pre-commit**: Runs Prettier formatting and ESLint dry-run. Commits are blocked on unresolved errors.
- **commit-msg**: Validates commit message format via Commitlint.

### Commit Convention

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): description
```

Examples:
- `feat(products): add pagination endpoint`
- `fix(products): validate price is positive`
- `test(products): add unit tests for DTO`

Available types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

## CI/CD

The project includes dual-platform CI/CD pipelines:

- **GitHub Actions**: `.github/workflows/ci.yml`
- **GitLab CI**: `.gitlab-ci.yml`

### Pipeline Stages

| Stage     | Description                                      |
|-----------|--------------------------------------------------|
| install   | Clean dependency installation (`npm ci`)         |
| audit     | Security audit (`npm audit --audit-level=critical`) |
| build     | Compile TypeScript, verify production boot       |
| test      | Unit tests (Jest) + Integration tests (Newman)   |
| sast      | Static analysis (ESLint, zero warnings)          |
| deploy    | Semantic Release dry-run (version computation)   |

The deploy stage runs only on `main` branch and executes `semantic-release --dry-run` to compute the next version without publishing.

## Project Structure

```
product-nest/
├── src/                          # Application source code
│   ├── main.ts                   # Entry point
│   ├── app.module.ts             # Root module
│   ├── products/                 # Products module
│   │   ├── products.controller.ts
│   │   ├── products.service.ts
│   │   ├── products.module.ts
│   │   ├── dto/                  # Data transfer objects
│   │   └── product.model.ts      # Sequelize model
│   └── export-swagger.ts         # Swagger export script
├── database/
│   ├── config/config.js          # Sequelize configuration
│   └── migrations/               # Database migrations
├── tests/
│   └── integration/              # Newman integration test collections
├── .knowledge/                   # Project specifications and prompts
├── docker-compose.yml            # Production compose stack
├── docker-compose.dev.yml        # Development compose (MySQL only)
├── Dockerfile                    # Multi-stage production image
├── Makefile                      # Command shortcuts
├── .gitlab-ci.yml                # GitLab CI pipeline
└── .github/workflows/ci.yml      # GitHub Actions pipeline
```

## Database Schema

Table: `products`

| Column         | Type           | Constraints              |
|----------------|----------------|--------------------------|
| `id`           | INTEGER        | AUTO_INCREMENT, PRIMARY KEY |
| `productToken` | VARCHAR(255)   | UNIQUE, NOT NULL         |
| `name`         | VARCHAR(255)   | NOT NULL                 |
| `price`        | DECIMAL(10,2)  | NOT NULL                 |
| `stock`        | INTEGER        | NOT NULL                 |

## Error Handling

- **Development** (`NODE_ENV=development`): Returns specific validation error messages (first error only).
- **Production** (`NODE_ENV=production`): Returns generic HTTP status labels only (e.g., `BAD_REQUEST`), no internal details exposed.

## Swagger / OpenAPI

Export the API documentation:

```bash
make swagger
```

Or manually:

```bash
npm run export-swagger
```

## Troubleshooting

### MySQL connection refused

Ensure MySQL is running and healthy:

```bash
docker compose ps
```

Wait for the healthcheck to pass before running migrations or starting the app.

### Port 3000 already in use

Change the host port mapping in `.env`:

```
APP_PORT=3001
```

### Migrations fail

Ensure the database exists and credentials match your `.env` configuration. Run `make clean` to reset everything and start fresh.

### Integration tests fail

Ensure MySQL is running, migrations are applied, and the application is started on port 3000 before running integration tests.
