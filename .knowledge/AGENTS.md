# AGENTS.md — Knowledge Base & Prompt Strategy

## Source of Truth

This `.knowledge/` folder is the **single source of truth** for the entire project. All AI agent behavior derives from here.

### God-Role Documents

| Document | Role |
|----------|------|
| `assessment.md` | **Domain specification** — defines WHAT the system must do. Contains the functional requirements, database schema, endpoints, and evaluation criteria. This is the acceptance contract. |
| `technical_requirements.md` | **Engineering blueprint** — defines HOW the system must be built. Contains tech stack, coding standards, infrastructure, CI/CD, testing strategy, and workflow rules. This is the implementation contract. |

These two documents are **immutable authorities**. All prompts, code, and architectural decisions must trace back to them. If a prompt contradicts these documents, the documents win.

## Prompt Strategy

### Location

All execution prompts live in `.knowledge/prompts/`.

### Philosophy

Each prompt is an **idempotent, self-validating unit of work**:

1. **Status Check first** — the agent verifies if the work is already done
2. **Implement only if needed** — if checks fail, execute implementation steps
3. **Validate** — run verification commands to confirm correctness
4. **Commit** — one conventional commit per prompt

This makes every prompt **re-runnable**. An agent can be dropped into the project at any point, read the execution matrix, and resume from where work stopped.

### Execution Flow

```
assessment.md + technical_requirements.md
            │
            ▼
    EXECUTION_MATRIX.md  (ordered dependency graph)
            │
            ▼
    PROMPT_00 → PROMPT_01 → ... → PROMPT_09
```

### Execution Matrix

`prompts/EXECUTION_MATRIX.md` tracks:
- Execution order and dependencies between prompts
- Current status of each prompt (⬜ PENDING / ✅ DONE / ❌ FAILED)
- What each prompt produces (output artifacts)

The agent must always read the matrix first to determine the next action.

### Rules

1. **Never skip prompts** — dependencies exist for a reason
2. **Never mark done without validation** — run the checks
3. **One commit per prompt** — conventional commit format
4. **Idempotent** — safe to re-run any prompt at any time
5. **Trace to source** — every implementation decision must be justifiable from `assessment.md` or `technical_requirements.md`
6. **Update the Execution Matrix immediately after completing a prompt** — mark the status as ✅ DONE with date in `prompts/EXECUTION_MATRIX.md`

## Agent Behavior

When an AI agent starts working on this project:

1. Read `assessment.md` — understand the domain
2. Read `technical_requirements.md` — understand the engineering constraints
3. Open `prompts/EXECUTION_MATRIX.md` — find the next pending prompt
4. Execute the prompt following the idempotency protocol
5. Update the matrix tracking table
6. Repeat until all prompts are ✅ DONE
