# Config Module - AGENTS.md

## Overview
This module handles application configuration and environment variable validation.

## Components
- **Configuration**: `configuration.ts` defines the configuration object structure.
- **Validation**: `env.validation.ts` uses Zod to validate environment variables.
- **Index**: `index.ts` exports configuration and validation for use in `AppModule`.

## Guidelines
- Always add new environment variables to `env.validation.ts` for schema validation.
- Provide sensible defaults where appropriate in `configuration.ts`.
- Keep the `.env.example` file in sync with new configuration requirements.
