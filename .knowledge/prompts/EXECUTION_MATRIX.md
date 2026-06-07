# Execution Matrix

## Overview

Each prompt is an **idempotent step**. The AI agent must:
1. Run the **Status Check** at the top of each prompt
2. If all checks pass → mark as DONE, move to next prompt
3. If any check fails → implement the missing parts
4. After implementation → re-run Status Check to confirm
5. End with the specified commit

## Execution Order

Prompts MUST be executed in sequential order. Each depends on the previous.

| # | Prompt | File | Depends On | Produces |
|---|--------|------|------------|----------|
| 0 | Project Scaffolding | `PROMPT_00_PROJECT_SCAFFOLDING.md` | — | `tsconfig.json`, `src/main.ts`, `src/app.module.ts`, `.eslintrc.js`, `.prettierrc`, `.husky/pre-commit` |
| 1 | Docker Compose | `PROMPT_01_DOCKER_COMPOSE.md` | #0 | `Dockerfile`, `docker-compose.yml`, `docker-compose.dev.yml`, `.env.example`, `.dockerignore` |
| 2 | Configuration | `PROMPT_02_CONFIGURATION.md` | #0 | `src/config/env.validation.ts`, `src/config/configuration.ts`, `src/config/index.ts` |
| 3 | Sequelize Setup | `PROMPT_03_SEQUELIZE_SETUP.md` | #2 | `src/database/database.module.ts`, `.sequelizerc`, `database/` migrations + config |
| 4 | Products Module | `PROMPT_04_PRODUCTS_MODULE.md` | #3 | `src/products/` (model, service, controller, DTOs, module) |
| 5 | Unit Tests | `PROMPT_05_UNIT_TESTS.md` | #4 | `jest.config.ts`, `*.spec.ts` files |
| 6 | Integration Tests | `PROMPT_06_INTEGRATION_TESTS.md` | #4 | `tests/integration/` (collection, environment) |
| 7 | CI/CD Pipelines | `PROMPT_07_CICD_PIPELINES.md` | #5, #6 | `.github/workflows/ci.yml`, `.gitlab-ci.yml` |
| 8 | Git Workflow | `PROMPT_08_GIT_WORKFLOW.md` | #0 | `.commitlintrc.json`, `.releaserc.json`, `.husky/commit-msg`, `.gitignore` |
| 9 | Makefile & Scripts | `PROMPT_09_MAKEFILE_SCRIPTS.md` | #1, #6 | `Makefile`, finalized `package.json` scripts |

## Dependency Graph

```
PROMPT_00 (Scaffolding)
├── PROMPT_01 (Docker)
├── PROMPT_02 (Config)
│   └── PROMPT_03 (Sequelize)
│       └── PROMPT_04 (Products)
│           ├── PROMPT_05 (Unit Tests)
│           └── PROMPT_06 (Integration Tests)
│               └── PROMPT_07 (CI/CD)
├── PROMPT_08 (Git Workflow)
└── PROMPT_09 (Makefile)
```

## Idempotency Protocol

Each prompt follows this execution contract:

```
┌─────────────────────────────┐
│  READ Status Check section  │
└──────────────┬──────────────┘
               │
       ┌───────▼───────┐
       │ All checks    │──── YES ──→ DONE (skip prompt)
       │ pass?         │
       └───────┬───────┘
               │ NO
       ┌───────▼───────┐
       │ Implement     │
       │ missing parts │
       └───────┬───────┘
               │
       ┌───────▼───────┐
       │ Re-run checks │──── FAIL ──→ Debug & fix
       │ pass?         │
       └───────┬───────┘
               │ YES
       ┌───────▼───────┐
       │ Run Validation│
       │ commands      │
       └───────┬───────┘
               │
       ┌───────▼───────┐
       │ Commit        │
       └───────────────┘
```

## Tracking Status

Update this section as prompts are executed:

| # | Status | Executed By | Date |
|---|--------|-------------|------|
| 0 | ✅ DONE | Kiro | 2026-06-07 |
| 1 | ✅ DONE | Kiro | 2026-06-07 |
| 2 | ✅ DONE | Kiro | 2026-06-07 |
| 3 | ✅ DONE | Kiro | 2026-06-07 |
| 4 | ✅ DONE | Kiro | 2026-06-07 |
| 5 | ✅ DONE | Kiro | 2026-06-07 |
| 6 | ⬜ PENDING | — | — |
| 7 | ⬜ PENDING | — | — |
| 8 | ⬜ PENDING | — | — |
| 9 | ⬜ PENDING | — | — |

Legend: ⬜ PENDING | 🔄 IN PROGRESS | ✅ DONE | ❌ FAILED
