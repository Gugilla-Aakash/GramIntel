.PHONY: demo seed backend frontend build test

demo:
	@echo "[demo] seeding backend..."
	@python3 -c "from backend.app.db import create_db_and_tables; create_db_and_tables(); print('[seed] tables ready')"
	@python3 -c "from backend.app.seed import seed; seed()"
	@echo "[demo] starting backend :8000 & frontend :3000"
	@uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 & \
	sleep 2 && \
	curl -s http://localhost:8000/health && \
	cd frontend && NEXT_PUBLIC_API_BASE=http://localhost:8000 npm run dev -- -p 3000 --hostname 0.0.0.0

seed:
	@python3 -c "from backend.app.db import create_db_and_tables; create_db_and_tables()"
	@python3 -c "from backend.app.seed import seed; seed()"

backend:
	uvicorn backend.app.main:app --reload --port 8000

frontend:
	cd frontend && npm run dev

build:
	cd frontend && npm run build

test:
	python3 -m pytest backend/tests -v
	cd frontend && npm run build
