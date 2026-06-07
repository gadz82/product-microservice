# Serializer Module - AGENTS.md

## Overview
This module handles JSON:API compliant serialization for application responses.

## Components
- **Services**: `JsonApiSerializer` provides generic methods for serializing single objects and collections.
- **Interfaces**: Definitions for JSON:API resources, links, and response structures.
- **Module**: `json-api.module.ts` provides the `JsonApiSerializer` as a shared service.

## Guidelines
- Follow the JSON:API specification for all public API responses.
- Ensure every resource has a `type`, `id`, and `attributes`.
- Use the `JsonApiSerializer` service to maintain a consistent output format across different modules.
