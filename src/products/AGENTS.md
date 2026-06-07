# Products Module - AGENTS.md

## Overview
This directory contains the core domain logic for Product management.

## Structure
- `controllers/`: `products.controller.ts` defines REST endpoints.
- `dto/`: Request validation schemas.
- `interfaces/`: Shared interfaces (e.g., `PaginatedProducts`).
- `models/`: `product.model.ts` Sequelize model.
- `repositories/`: `products.repository.ts` data access layer.
- `serializers/`: `products.serializer.ts` for JSON:API compliance.
- `services/`:
  - `product-read.service.ts`: Handles GET operations and listing.
  - `product-write.service.ts`: Handles data mutation and invalidation.

## Guidelines
- Follow the Repository pattern for data access.
- Split business logic into Read and Write services (CQS-lite).
- Only export `ProductReadService` from the module to restrict mutation access from outside.
- Use DTOs with `class-validator` for all input validation and `@nestjs/swagger` decorators for API documentation.
- Maintain BDD-style unit tests (`*.spec.ts`) in respective subdirectories.
- Adhere to the project's coding standards (Tabs, Single Quotes, No Trailing Comma).
