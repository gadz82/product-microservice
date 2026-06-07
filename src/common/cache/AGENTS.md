# Cache Module - AGENTS.md

## Overview
This module provides caching capabilities using Redis as a lazy cache system.

## Components
- **Module**: `cache.module.ts` configures the Redis client and provides the `RedisLazyCacheService`.
- **Services**: `RedisLazyCacheService` implements lazy caching logic (get, set, del, delByPrefix).
- **Interfaces**: Definitions for cache services and configurations.

## Guidelines
- Use `RedisLazyCacheService` for all caching needs.
- Default TTL is 60 seconds.
- Follow the `feature:type:identifier` key naming convention (e.g., `product:detail:tok-1`).
- Ensure cache invalidation occurs on write operations (create, update, delete).
