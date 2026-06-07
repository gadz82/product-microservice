.PHONY: up down build test unit-test integration-test migrate smoke-test logs clean dev

up:
	npm i
	docker compose up -d
	@echo "Waiting for services to be healthy..."
	@docker compose exec mysql mysqladmin ping -h localhost --silent || sleep 5
	@echo "Environment is up."

down:
	docker compose down

build:
	npm run build

test: unit-test integration-test

unit-test:
	npm run run-unit-test

integration-test: up migrate
	@sleep 3
	npm run run-integration-test

migrate:
	npm run db:migrate

smoke-test: up migrate
	@sleep 3
	@curl -sf http://localhost:3000/products?page=1&limit=1 > /dev/null && echo "Smoke test passed" || echo "Smoke test failed"

logs:
	docker compose logs -f

clean: down
	rm -rf dist coverage node_modules

dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
