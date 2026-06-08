# AGENTS.md

## Project

**products-service** — NestJS microservice for e-commerce product management (CRUD) with Sequelize ORM + MySQL.

## Architecture

- **Framework**: NestJS (standalone microservice)
- **Language**: TypeScript (strict mode)
- **ORM**: Sequelize + sequelize-typescript
- **Database**: MySQL 8.0
- **Containerization**: Docker Compose (app, mysql with healthchecks)
- **Testing**: Jest (unit), Newman (integration)
- **CI/CD**: GitHub Actions + GitLab CI (dual-platform)
- **Versioning**: Semantic Release + Conventional Commits

## Domain

Single module: **Products**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/products` | POST | Create product (name, productToken, price, stock) |
| `/products` | GET | List with pagination (?page, ?limit) |
| `/products/:id` | GET | Get single product |
| `/products/:id/stock` | PATCH | Update stock |
| `/products/:id` | DELETE | Remove product |

Table `products`: id (PK auto-increment), productToken (unique), name, price (decimal), stock (integer).

## Code Standards

| Rule | Value |
|------|-------|
| Indentation | Tabs (width 4) |
| Print width | 150 |
| End of line | LF |
| Trailing comma | None |
| Quotes | Single |
| Semicolons | Yes |
| Comments | Minimal, few words at critical logic only |
| Tests | BDD nested describe (Class → Method → behavior) |
| Commits | Semantic Release styled Commits (`type(scope): description`) |

## Knowledge Base

All detailed specs and execution prompts live in `.knowledge/`:

```
.knowledge/
├── AGENTS.md                  ← Prompt strategy & execution protocol
├── assessment.md              ← Domain contract (WHAT to build)
├── technical_requirements.md  ← Engineering contract (HOW to build)
└── prompts/
    ├── EXECUTION_MATRIX.md    ← Dependency graph & progress tracking
    └── PROMPT_00..09          ← Idempotent implementation steps
database/                      ← Sequelize migrations & configuration
```

## How to Work on This Project

1. Read `.knowledge/AGENTS.md` for execution strategy
2. Read `.knowledge/prompts/EXECUTION_MATRIX.md` to find next pending prompt
3. Execute prompts in order — each is idempotent (check → implement if needed → validate → commit)

## Test execution and validation
Always use package.json script, e.g. to run Unit Tests use npm run unit-test
