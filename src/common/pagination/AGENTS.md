# Pagination Module - AGENTS.md

## Overview
This module provides standardized pagination utilities, including offset-based and cursor-based pagination.

## Components
- **Pipes**: `ParsePaginationTypePipe` validates the `pt` query parameter (`ol` or `cursor`).
- **Constants**: Default values for page, limit, and size.
- **Utils**: `cursor.ts` handles Base64 encoding and decoding for cursor-based pagination.
- **Interfaces**: Common pagination request and response interfaces.

## Guidelines
- Support both Offset (`ol`) and Cursor (`cursor`) pagination where applicable.
- Use `PAGINATION_DEFAULTS` for consistency.
- Always encode internal IDs in cursors using the provided utilities.
