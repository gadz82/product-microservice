# Project Technical Requirements: E-Commerce Products Microservice

A state-of-the-art NestJS microservice for an e-commerce platform. Manages products via CRUD operations using Sequelize ORM and MySQL.

---

## 1. Core Development Principles

- **SOLID Principles**: Strict adherence mandatory across entire codebase.
- **Test-Driven Development (TDD)**: All features designed, developed, and verified via TDD.
- **State-of-the-Art NestJS**: Current industry best practices for modularity, maintainability, efficiency.
- **Architecture**: Standalone NestJS Microservice (`products-service`).

---

## 2. Domain: Products Module

### Database Schema

Table: `products` (database: `ecommerce`)

| Column         | Type    | Constraints        |
|----------------|---------|--------------------|
| `id`           | integer | auto-increment, PK |
| `productToken` | string  | unique             |
| `name`         | string  |                    |
| `price`        | decimal |                    |
| `stock`        | integer |                    |

### Endpoints

| Operation  | Description                                                      |
|------------|------------------------------------------------------------------|
| **Create** | Add new product. Body: `name`, `productToken`, `price`, `stock`. |
| **List**   | Retrieve all products with pagination.                           |
| **Get**    | Retrieve a specific product.                                     |
| **Update** | Update stock quantity of a specific product.                     |
| **Delete** | Remove a product from the database.                              |

### Validation & Error Handling

- Validate all incoming requests (`class-validator`).
- Return meaningful error messages with correct HTTP status codes.

### Usage Examples

- Provide sample requests and responses for all CRUD operations.

---

## 3. Tech Stack & ORM

- **Framework**: Latest stable NestJS.
- **Language**: Latest stable TypeScript.
- **ORM**: Sequelize (`sequelize` package).
- **Model**: Sequelize model for `products` table.
- **Patterns**: NestJS decorators (`@Controller()`, `@Post()`, `@Get()`, `@Body()`, etc.), dependency injection.

---

## 4. Coding Standards & Code Quality

### Code Formatting & Linting

ESLint + Prettier with strict config:

| Setting        | Value  |
|----------------|--------|
| End of Line    | `lf`   |
| Trailing Comma | `none` |
| Use Tabs       | `true` |
| Tab Width      | `4`    |
| Print Width    | `150`  |

### Git Hooks

- Husky pre-commit hook executing Prettier + ESLint dry-run.
- Block commit on any unresolved errors or warnings.

### Dependency Management

- Absolute minimum external dependencies.
- Trivial operations → custom code, not libraries.

### Documentation & Test Conventions

- **Source Code**: Minimal comments. Few words only at beginning of critical logic blocks.
- **Unit Tests**: Strict nested BDD-style naming:
  - Outer `describe`: targeted Class.
  - Inner `describe`: targeted method.
  - `it`: precise description of branch/edge-case validated.

---

## 5. Infrastructure, Configuration & Environment

### Docker Compose

Orchestrate local environment with:

| Service     | Container                        |
|-------------|----------------------------------|
| Application | Node.js running NestJS           |
| Database    | MySQL                            |
| Cache       | Redis                            |

**Orchestration**: `depends_on` with native healthchecks for MySQL and Redis. App waits until dependencies ready.

### Configuration & Environment Validation

- Runtime validation of all env vars (`@nestjs/config` + Zod or Joi).
- **Fail-fast**: Block startup if any required config missing or invalid.

### Database Management

- Schema DDL strictly via database migrations only.

---

## 6. Automation Scripts & Task Management

### Package Scripts

| Script                         | Purpose                                        |
|--------------------------------|------------------------------------------------|
| `npm run run-dev`              | Self-contained local dev environment (hot-reload) |
| `npm run build`                | Compile TypeScript to deployable JS            |
| `npm run run-unit-test`        | Execute unit test suite (Jest)                 |
| `npm run run-integration-test` | Execute integration tests (Newman)             |

### Makefile

Single-command shortcuts for:

- Start/stop local environment.
- Run smoke tests.
- Execute full test suites (unit + integration).
- Generate, manage, and run database migrations.

---

## 7. Version Control & Branching Strategy

### Git Initialization

- Project initialized as a local Git repository (no remote origin configured yet).

### Branching Model (Gitflow)

Standard Gitflow:

```
feature/* → develop → release/* → main
```

- `main`: production-ready code, tagged releases only.
- `develop`: integration branch for features.
- `release/*`: stabilization before merge to main.
- `feature/*`: individual feature branches off develop.

### Commit Conventions (Commitlint)

- Every commit must comply with [Conventional Commits](https://www.conventionalcommits.org/) specification.
- Commitlint enforced via Husky commit-msg hook.
- Format: `type(scope): description` (e.g., `feat(products): add pagination endpoint`).

### Semantic Release

- Project configured with `semantic-release` for automated versioning and changelog generation.
- Release triggered from `main` branch merges.
- CI deploy stage runs `semantic-release --dry-run` to output next version number without publishing (mock deployment phase).
- When deploy becomes real: semantic-release creates Git tag + GitHub/GitLab release.

---

## 8. CI/CD Pipeline

Pipeline must be dual-platform: both `.gitlab-ci.yml` and `.github/workflows/` (GitHub Actions). GitLab pipeline must be executable locally with `gitlab-ci-local`.

### Pipeline Stages

1. **Dependency Installation**: Clean install including devDependencies.
2. **Security Audit**: `npm audit` for vulnerable/deprecated packages.
3. **Build** (two sub-stages):
   - **A**: Compile to `/dist` with full devDependencies.
   - **B**: `npm prune --production` simulation — verify `/dist` boots with runtime deps only.
4. **Unit Testing**: Jest suite execution.
5. **Integration Testing**: Newman endpoint/flow validation.
6. **SAST Analysis**: Static security scan for common vulnerabilities.
7. **Deployment**: Run `semantic-release --dry-run` — output computed next version. No actual publish/tag yet.

---

## 9. AI Agent Context & Tooling

- Root-level `AGENTS.md`: architectural overview and project goals.
- Localized `AGENTS.md` in core module directories: isolated business logic context.

---

## 10. Workflow Rules

- **Every prompt/task must end with a commit** tracking activities executed in that prompt. Commit message follows Conventional Commits format.

---

## Evaluation Criteria

- Correct CRUD implementation (NestJS + Sequelize).
- Proper TypeScript usage.
- Request validation and error handling.
- Effective NestJS decorators and dependency injection.
- Best practices adherence.
- Tests.
- Documentation.
