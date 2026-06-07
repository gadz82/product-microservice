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

smoke-test:
	npm ci
	npm run build
	npm run run-unit-test
	docker compose up -d
	@echo "Waiting for services to be healthy..."
	@docker compose exec mysql mysqladmin ping -h localhost --silent || sleep 5
	npm run db:migrate
	@sleep 3
	npm run run-integration-test

logs:
	docker compose logs -f

clean: down
	rm -rf dist coverage node_modules

dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
