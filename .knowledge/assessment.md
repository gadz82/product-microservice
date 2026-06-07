# Assessment: E-Commerce Products Microservice

## Overview

Backend service for an e-commerce platform using **NestJS** + **Sequelize** ORM + **MySQL**. Goal: a fully functional Products module with CRUD operations.

---

## Domain: Products

### Database Schema

Table: `products` (database: `ecommerce`)

| Column         | Type           | Constraints              |
|----------------|----------------|--------------------------|
| `id`           | integer        | auto-increment, PK       |
| `productToken` | string         | unique                   |
| `name`         | string         |                          |
| `price`        | decimal        |                          |
| `stock`        | integer        |                          |

---

## Functional Requirements

### Endpoints

| Operation        | Description                                                        |
|------------------|--------------------------------------------------------------------|
| **Create**       | Add new product. Body: `name`, `productToken`, `price`, `stock`.   |
| **List (Read)**  | Retrieve all products with pagination.                             |
| **Get**          | Retrieve a specific product.                                       |
| **Update**       | Update stock quantity of a specific product.                       |
| **Delete**       | Remove a product from the database.                                |

### Validation & Error Handling

- Validate all incoming requests (e.g., `class-validator`).
- Return meaningful error messages with correct HTTP status codes.

### Usage Examples

- Provide sample requests and responses demonstrating all CRUD operations.

---

## Technical Constraints

- **ORM**: Sequelize (`sequelize` package).
- **Model**: Define a Sequelize model for `products` table.
- **NestJS patterns**: Decorators (`@Controller()`, `@Post()`, `@Get()`, `@Body()`, etc.), dependency injection.
- **Architecture**: Standalone NestJS Microservice (`products-service`).

---

## Evaluation Criteria

- Correct CRUD implementation with NestJS + Sequelize.
- Proper TypeScript usage.
- Request validation and error handling.
- Effective use of NestJS decorators and dependency injection.
- NestJS/Sequelize best practices adherence.
- Tests.
- Documentation.
