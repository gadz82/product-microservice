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

# 4. Install agent skills (optional — enables AI coding assistants to understand the project)
npx skills experimental_install

# 5. Start the development environment (MySQL + hot-reload app)
npm run quickstart
```

The API will be available at `http://localhost:3000`.

Swagger UI is available at `http://localhost:3000/api/docs`.

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
| `LOGGER_LEVEL`    | `DEBUG`       | Log level (DEBUG, INFO, WARNING, ERROR, SILENT) |

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
npm run start:dev
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

| Method   | Endpoint                             | Description                          |
|----------|--------------------------------------|--------------------------------------|
| `POST`   | `/v1/products`                      | Create a new product                 |
| `GET`    | `/v1/products`                      | List products (paginated)            |
| `GET`    | `/v1/products/:productToken`         | Get a specific product               |
| `PATCH`  | `/v1/products/:productToken`         | Update product (stock)               |
| `DELETE` | `/v1/products/:productToken`         | Remove a product                     |

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
    "type": "products",
    "id": "unique-token-123",
    "attributes": {
      "productToken": "unique-token-123",
      "name": "Product Name",
      "price": 29.99,
      "stock": 100,
      "createdAt": "2026-06-07T16:27:00.000Z",
      "updatedAt": "2026-06-07T16:27:00.000Z"
    }
  }
}
```

### Pagination

The list endpoint supports dual pagination via the `pt` (pagination type) parameter:

| Parameter      | Description                                      |
|----------------|--------------------------------------------------|
| `pt`           | Pagination type: `offset` (default) or `cursor`  |
| `page`         | Page number, 1-based (offset pagination only)    |
| `limit`        | Items per page (offset pagination only)          |
| `page[size]`   | Page size (cursor pagination only)                |
| `page[after]`  | Cursor token for next page (cursor pagination)    |

**Offset pagination** (default):

```
GET /v1/products?page=1&limit=10
GET /v1/products?pt=offset&page=2&limit=10
```

**Cursor pagination**:

```
GET /v1/products?pt=cursor&page[size]=10
GET /v1/products?pt=cursor&page[size]=10&page[after]=MQ==
```

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
│   ├── common/                   # Shared infrastructure
│   │   ├── config/               # Env validation (Zod) + configuration
│   │   ├── database/             # Sequelize module
│   │   ├── filters/              # Global exception filters
│   │   ├── logger/               # Custom logger service
│   │   ├── pagination/           # Pagination pipes, constants, cursor utils
│   │   └── serializer/           # JSON:API serializer
│   ├── products/                 # Products module
│   │   ├── controllers/          # REST endpoints
│   │   ├── services/             # Read/Write service (CQS split)
│   │   ├── repositories/         # Data access layer
│   │   ├── serializers/          # JSON:API product serializer
│   │   ├── dto/                  # Request/response DTOs
│   │   ├── models/               # Sequelize model
│   │   ├── interfaces/          # Paginated result types
│   │   └── products.module.ts
│   └── export-swagger.ts         # Swagger export script
├── database/
│   ├── config/config.js          # Sequelize CLI configuration
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

## SOLID Principles

The architecture follows SOLID principles to ensure maintainability and separation of concerns:

**Single Responsibility** — Each class has one job. `ProductReadService` handles queries, `ProductWriteService` handles mutations. `ProductsRepository` encapsulates data access, `ProductsSerializer` encapsulates response formatting, `ProductsController` orchestrates HTTP concerns only.

**Open/Closed** — Pagination supports both offset and cursor strategies through the `pt` pipe and shared repository interface without modifying the controller. New pagination types can be added by extending `PAGINATION_TYPES`. Exception filters are separate classes that can be extended without touching existing ones.

**Liskov Substitution** — All services implement `@Injectable()` and are consumed through their concrete types via NestJS DI. The `LoggerService` implements the NestJS `LoggerService` interface, making it swappable with any NestJS-compatible logger.

**Interface Segregation** — DTOs are split by use case: `CreateProductDto` for creation, `UpdateStockDto` for partial updates. The `PaginatedProducts` interface carries only the fields each pagination mode needs. The `JsonApiSerializer` exposes focused methods (`serializeOne`, `serializeMany`) rather than a single generic method.

**Dependency Inversion** — High-level modules depend on abstractions, not implementations. The controller depends on `ProductReadService` and `ProductWriteService`, not the repository directly. `ProductWriteService` uses `ProductReadService.findOneByToken` for existence checks instead of direct DB queries. All dependencies are injected through NestJS DI, making testing straightforward with mocks.

### CQS Lite

The product domain splits read and write paths into separate services (`ProductReadService` / `ProductWriteService`) following Command-Query Separation. This keeps query logic (pagination, filtering) separate from mutation logic (create, update, delete) and prevents write-side concerns from leaking into read paths.

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

The API documentation is available interactively at `http://localhost:3000/api/docs` when the service is running.

Export the OpenAPI specification to a JSON file:

```bash
make swagger
```

Or manually:

```bash
npm run export-swagger
```

### Importing into Postman

1. Start the application: `npm run start:dev`
2. Export the schema: `npm run export-swagger`
3. Open Postman → **Import** → **File** → select `openapi.json` from the project root
4. Postman auto-generates a collection with all endpoints, request bodies, and response schemas

## AI Agent Support

This project includes structured metadata designed for AI coding agents. These files enable autonomous agents to understand the domain, follow conventions, and continue implementation work without human intervention.

### AGENTS.md (Root)

The root-level `AGENTS.md` is the **entry point** for any AI agent. It provides:

- Architecture overview (NestJS, Sequelize, MySQL)
- Domain summary (Products module, endpoints, schema)
- Code standards (tabs, single quotes, BDD tests, conventional commits)
- How to work on the project (read `.knowledge/` → execute prompts → commit)

### .knowledge/ Folder

The `.knowledge/` directory is the **single source of truth** for the entire project. It contains domain contracts, engineering blueprints, and idempotent execution prompts:

| File | Role |
|------|------|
| `AGENTS.md` | Prompt strategy and execution protocol |
| `assessment.md` | **Domain specification** — defines WHAT the system must do (functional requirements, schema, endpoints, acceptance criteria) |
| `technical_requirements.md` | **Engineering blueprint** — defines HOW the system must be built (tech stack, standards, CI/CD, workflow rules) |
| `prompts/EXECUTION_MATRIX.md` | Dependency graph and progress tracking (⬜ PENDING / ✅ DONE / ❌ FAILED) |
| `prompts/PROMPT_00..12` | Idempotent implementation steps — each self-validating (check → implement → validate → commit) |

**Execution flow:**

```
assessment.md + technical_requirements.md
            │
            ▼
    EXECUTION_MATRIX.md  (ordered dependency graph)
            │
            ▼
    PROMPT_00 → PROMPT_01 → ... → PROMPT_12
```

An agent can be dropped into the project at any point, read the matrix, and resume from where work stopped.

### skills-lock.json

This file is the **agent-skills equivalent of `package-lock.json`**. It records which skills are installed, their source, and a content hash for reproducibility:

```json
{
  "version": 1,
  "skills": {
    "nestjs-best-practices": {
      "source": "kadajett/agent-nestjs-skills",
      "sourceType": "github",
      "skillPath": "SKILL.md",
      "computedHash": "1b6f82e..."
    }
  }
}
```

**Using [vercel-labs/skills](https://github.com/vercel-labs/skills) CLI:**

```bash
# Install skills from skills-lock.json
npx skills experimental_install

# Install for specific agents only
npx skills experimental_install -a claude-code -a opencode

# Update skills from their source (re-fetches latest)
npx skills update
```

**Why commit `skills-lock.json`?** Same reason you commit `package-lock.json` — it ensures all contributors and CI environments use the same skill versions. The `computedHash` lets the CLI detect drift.

### Custom Skill: product-nest-onboarding

This project ships a custom local skill at `.skills/product-nest-onboarding/SKILL.md`. It's an opinionated onboarding agent designed for developers (and their AI assistants) joining the project. Rather than a dry reference manual, it reads like the notes you'd scribble after your first week — the tribal knowledge you'd normally have to pester a senior dev for.

**What it covers:**

- Architecture decisions and *why* they were made (CQS lite, repository pattern, serializer layer, Zod validation, `stopAtFirstError`)
- Every way to run the app (quickstart, manual, Docker, Makefile)
- JSON:API response internals — how domain objects become wire format, where `productToken` lives and why
- Dual pagination (offset vs cursor) with concrete examples
- Error handling philosophy — dev gets detail, prod gets nothing
- Testing strategies (unit conventions, integration with Newman, smoke tests)
- Code style rules with zero-tolerance enforcement explained
- Commit conventions and CI/CD pipeline stages
- Database migration workflow and Docker compose strategies
- Common "why?" questions that save you from reading the spec docs

The skill is registered in `skills-lock.json` with `sourceType: "local"` and will be installed by `npx skills experimental_install` alongside any remote skills.

```
.skills/
└── product-nest-onboarding/
    └── SKILL.md        # The onboarding knowledge base
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
