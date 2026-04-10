.PHONY: run down

run:
	docker compose up -d
	DATABASE_URL=postgresql://postgres:postgres@localhost:5432/movie_theater npm run db:migrate
	DATABASE_URL=postgresql://postgres:postgres@localhost:5432/movie_theater npm run db:seed
	DATABASE_URL=postgresql://postgres:postgres@localhost:5432/movie_theater npx concurrently \
		-n backend,frontend \
		-c blue,green \
		"npm run dev -w packages/backend" \
		"npm run dev -w packages/frontend"

down:
	-pkill -f "tsx watch src/local-server.ts"
	-pkill -f "vite"
	docker compose down -v
