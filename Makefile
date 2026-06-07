.PHONY: install up down build test unit-test integration-test migrate smoke-test full-test logs clean dev

install:
	npm run setup

up: install build
	docker compose up -d
	@echo "Waiting for services to be healthy..."
	@docker compose exec mysql mysqladmin ping -h localhost --silent || sleep 5
	@echo "Environment is up."

down:
	docker compose down -v

build: install
	npm run build

test: unit-test integration-test

unit-test: install
	npm run run-unit-test

integration-test: smoke-test
	@sleep 3
	npm run run-integration-test

migrate: install build up
	npm run db:migrate

smoke-test: install build unit-test
	docker compose up -d
	@echo "Waiting for services to be healthy..."
	@docker compose exec mysql mysqladmin ping -h localhost --silent || sleep 5
	npm run db:migrate
	@sleep 5
	@curl -sf http://localhost:3000/products?page=1&limit=1 > /dev/null && echo "Smoke test passed" || echo "Smoke test failed"

full-test: down install build unit-test smoke-test
	npm run run-integration-test && npm run run-integration-test:pagination

logs:
	docker compose logs -f

clean: down
	rm -rf dist coverage node_modules

dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
