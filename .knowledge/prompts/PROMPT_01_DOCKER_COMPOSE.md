# PROMPT_01: Docker Compose

## Status Check

Before executing, verify:
- [ ] `docker-compose.yml` exists with services: app, mysql, redis
- [ ] MySQL service has healthcheck configured
- [ ] Redis service has healthcheck configured
- [ ] App service uses `depends_on` with `condition: service_healthy`
- [ ] `.env.example` exists with all required env vars
- [ ] `Dockerfile` exists for the application (multi-stage build)

If ALL checks pass → mark as DONE. Otherwise, implement missing parts.

---

## Task

Create Docker Compose orchestration with MySQL, Redis, and NestJS app. All services must have healthchecks, and the app must wait for dependencies to be healthy.

## Implementation Steps

### 1. Create Dockerfile

Create `Dockerfile`:
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### 2. Create docker-compose.yml

```yaml
services:
  mysql:
    image: mysql:8.0
    container_name: products-mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD:-rootpassword}
      MYSQL_DATABASE: ${DB_NAME:-ecommerce}
      MYSQL_USER: ${DB_USER:-appuser}
      MYSQL_PASSWORD: ${DB_PASSWORD:-apppassword}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${DB_ROOT_PASSWORD:-rootpassword}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  redis:
    image: redis:7-alpine
    container_name: products-redis
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: products-app
    ports:
      - "${APP_PORT:-3000}:3000"
    environment:
      NODE_ENV: ${NODE_ENV:-development}
      PORT: 3000
      DB_HOST: mysql
      DB_PORT: 3306
      DB_NAME: ${DB_NAME:-ecommerce}
      DB_USER: ${DB_USER:-appuser}
      DB_PASSWORD: ${DB_PASSWORD:-apppassword}
      REDIS_HOST: redis
      REDIS_PORT: 6379
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy

volumes:
  mysql_data:
```

### 3. Create docker-compose.dev.yml (override for dev with hot-reload)

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: builder
    command: npx nest start --watch
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      NODE_ENV: development
```

### 4. Create .env.example

```env
NODE_ENV=development
PORT=3000
APP_PORT=3000

DB_HOST=mysql
DB_PORT=3306
DB_NAME=ecommerce
DB_USER=appuser
DB_PASSWORD=apppassword
DB_ROOT_PASSWORD=rootpassword

REDIS_HOST=redis
REDIS_PORT=6379
```

### 5. Create .dockerignore

```
node_modules
dist
.git
.env
*.md
.idea
```

## Validation

```bash
docker compose config
docker compose build --no-cache
docker compose up -d
docker compose ps  # all services should be healthy
docker compose down
```

## Commit

```bash
git add -A
git commit -m "feat(docker): add Docker Compose with MySQL, Redis, healthchecks"
```
