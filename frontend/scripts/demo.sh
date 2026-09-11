#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
echo "[demo] GramIntel — one-command demo"
echo "[demo] root: $ROOT"

echo "[demo] seeding backend..."
cd "$ROOT"
python3 -c "from backend.app.db import create_db_and_tables; create_db_and_tables(); print('[seed] tables ready')"
python3 -c "from backend.app.seed import seed; seed()"

echo "[demo] starting backend on :8000..."
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
sleep 2
curl -s http://localhost:8000/health || { echo "[demo] backend failed to start"; kill $BACKEND_PID; exit 1; }

echo "[demo] backend ready (pid $BACKEND_PID), starting frontend on :3000..."
cd "$ROOT/frontend"
NEXT_PUBLIC_API_BASE=http://localhost:8000 npm run dev -- -p 3000 --hostname 0.0.0.0 &
FRONTEND_PID=$!
wait $BACKEND_PID $FRONTEND_PID
