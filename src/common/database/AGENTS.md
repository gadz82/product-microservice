# Database Module - AGENTS.md

## Overview
This module integrates Sequelize ORM with NestJS for database management.

## Components
- **Module**: `database.module.ts` uses `SequelizeModule.forRootAsync` to configure the database connection.

## Guidelines
- Models should be defined in their respective domain modules.
- Use `SequelizeModule.forFeature` in domain modules to register models.
- Ensure database connections are managed via environment variables.
