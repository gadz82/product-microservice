# Testing - AGENTS.md

## Overview
Test suites for the microservice, including integration tests. Unit tests are located alongside source code.

## Structure
- `integration/`: Newman (Postman) collections for end-to-end API testing.
- `unit`: (Located in `src/`) Jest specs for component testing.

## Guidelines
- **Unit Tests**:
    - Use BDD style (`describe` → `it`).
    - Mock external dependencies (database, Redis).
    - Aim for high branch coverage.
- **Integration Tests**:
    - Use Newman to run collections against a running environment.
    - Test complete user flows (e.g., Create → Get → Update → Delete).
    - Validate both success and error responses.
