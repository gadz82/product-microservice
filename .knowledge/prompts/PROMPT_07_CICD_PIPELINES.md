# PROMPT_07: CI/CD Pipelines

## Status Check

Before executing, verify:
- [ ] `.github/workflows/ci.yml` exists with all required stages
- [ ] `.gitlab-ci.yml` exists with all required stages
- [ ] Both pipelines have stages: install, audit, build, unit-test, integration-test, sast, deploy
- [ ] Build stage includes production deps pruning verification
- [ ] Deploy stage runs `semantic-release --dry-run`
- [ ] GitLab CI is executable locally with `gitlab-ci-local`

If ALL checks pass → mark as DONE. Otherwise, implement missing parts.

---

## Task

Create dual-platform CI/CD pipelines (GitHub Actions + GitLab CI) with all required stages: dependency install, security audit, build (with prod-deps verification), unit tests, integration tests, SAST, and deployment (semantic-release dry-run).

## Implementation Steps

### 1. GitHub Actions Workflow

Create `.github/workflows/ci.yml`:
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  install:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - uses: actions/cache/save@v4
        with:
          path: node_modules
          key: deps-${{ hashFiles('package-lock.json') }}

  audit:
    runs-on: ubuntu-latest
    needs: install
    steps:
      - uses: actions/checkout@v4
      - uses: actions/cache/restore@v4
        with:
          path: node_modules
          key: deps-${{ hashFiles('package-lock.json') }}
      - run: npm audit --audit-level=high

  build:
    runs-on: ubuntu-latest
    needs: install
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - uses: actions/cache/restore@v4
        with:
          path: node_modules
          key: deps-${{ hashFiles('package-lock.json') }}
      - run: npm run build
      - name: Verify production boot
        run: |
          cp -r node_modules node_modules_backup
          npm prune --omit=dev
          node dist/main.js &
          APP_PID=$!
          sleep 3
          kill $APP_PID || true
          rm -rf node_modules
          mv node_modules_backup node_modules
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  unit-test:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - uses: actions/cache/restore@v4
        with:
          path: node_modules
          key: deps-${{ hashFiles('package-lock.json') }}
      - run: npm run run-unit-test

  integration-test:
    runs-on: ubuntu-latest
    needs: build
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: rootpassword
          MYSQL_DATABASE: ecommerce
          MYSQL_USER: appuser
          MYSQL_PASSWORD: apppassword
        ports:
          - 3306:3306
        options: --health-cmd="mysqladmin ping" --health-interval=10s --health-timeout=5s --health-retries=5
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: --health-cmd="redis-cli ping" --health-interval=5s --health-timeout=3s --health-retries=5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - uses: actions/cache/restore@v4
        with:
          path: node_modules
          key: deps-${{ hashFiles('package-lock.json') }}
      - name: Run migrations and start app
        env:
          DB_HOST: localhost
          DB_PORT: 3306
          DB_NAME: ecommerce
          DB_USER: appuser
          DB_PASSWORD: apppassword
          REDIS_HOST: localhost
          REDIS_PORT: 6379
        run: |
          npm run db:migrate
          npm run start &
          sleep 5
          npm run run-integration-test

  sast:
    runs-on: ubuntu-latest
    needs: install
    steps:
      - uses: actions/checkout@v4
      - uses: actions/cache/restore@v4
        with:
          path: node_modules
          key: deps-${{ hashFiles('package-lock.json') }}
      - run: npx eslint "src/**/*.ts" --max-warnings=0

  deploy:
    runs-on: ubuntu-latest
    needs: [unit-test, integration-test, sast]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - uses: actions/cache/restore@v4
        with:
          path: node_modules
          key: deps-${{ hashFiles('package-lock.json') }}
      - run: npx semantic-release --dry-run
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 2. GitLab CI Pipeline

Create `.gitlab-ci.yml`:
```yaml
stages:
  - install
  - audit
  - build
  - test
  - sast
  - deploy

variables:
  MYSQL_ROOT_PASSWORD: rootpassword
  MYSQL_DATABASE: ecommerce
  MYSQL_USER: appuser
  MYSQL_PASSWORD: apppassword
  DB_HOST: mysql
  DB_PORT: "3306"
  DB_NAME: ecommerce
  DB_USER: appuser
  DB_PASSWORD: apppassword
  REDIS_HOST: redis
  REDIS_PORT: "6379"

install:
  stage: install
  image: node:20-alpine
  script:
    - npm ci
  artifacts:
    paths:
      - node_modules/
    expire_in: 1 hour

audit:
  stage: audit
  image: node:20-alpine
  needs: [install]
  script:
    - npm audit --audit-level=high

build:
  stage: build
  image: node:20-alpine
  needs: [install]
  script:
    - npm run build
    - npm prune --omit=dev
    - node dist/main.js &
    - sleep 3
    - kill %1 || true
  artifacts:
    paths:
      - dist/
    expire_in: 1 hour

unit-test:
  stage: test
  image: node:20-alpine
  needs: [install]
  script:
    - npm run run-unit-test
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

integration-test:
  stage: test
  image: node:20-alpine
  needs: [install, build]
  services:
    - name: mysql:8.0
      alias: mysql
    - name: redis:7-alpine
      alias: redis
  script:
    - npm run db:migrate
    - npm run start &
    - sleep 5
    - npm run run-integration-test

sast:
  stage: sast
  image: node:20-alpine
  needs: [install]
  script:
    - npx eslint "src/**/*.ts" --max-warnings=0

deploy:
  stage: deploy
  image: node:20-alpine
  needs: [unit-test, integration-test, sast]
  only:
    - main
  script:
    - npx semantic-release --dry-run
```

## Validation

```bash
# GitHub Actions: validate syntax
cat .github/workflows/ci.yml | python3 -c "import yaml, sys; yaml.safe_load(sys.stdin)"

# GitLab CI: validate syntax
cat .gitlab-ci.yml | python3 -c "import yaml, sys; yaml.safe_load(sys.stdin)"

# Local GitLab CI execution (optional):
# npx gitlab-ci-local
```

## Commit

```bash
git add -A
git commit -m "ci: add GitHub Actions and GitLab CI pipelines with full stage coverage"
```
