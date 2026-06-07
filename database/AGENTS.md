# Database - AGENTS.md

## Overview
Database configuration and Sequelize migrations.

## Structure
- `config/`: Database connection settings for different environments.
- `migrations/`: SQL migration files for schema changes.

## Guidelines
- Always use migrations for schema updates; never modify the database manually.
- Migrations should be reversible (`up` and `down` methods).
- Use Sequelize CLI or equivalent scripts to generate and run migrations.
- Ensure migration scripts follow the project's naming convention (timestamp-based).
