# ACME Salary Management

A web app that lets ACME's HR manager manage salary data for 10,000 employees across countries, and answer questions about how the org pays people.

- [Requirements](docs/01-requirements.md): goal, scope, what's out and why
- [Design notes](docs/02-design.md): architecture, data model, API, trade-offs, performance
- [AI workflow](docs/03-ai-workflow.md): how AI tools were used

## Running locally

### Backend (Python 3.13, [uv](https://docs.astral.sh/uv/))

```bash
cd backend
uv sync                                   # install deps into .venv
uv run python -m app.seed                 # 10,000 employees (idempotent; --reset to re-seed)
uv run uvicorn app.main:app --reload      # http://localhost:8000/docs
uv run pytest                             # tests
uv run ruff check . && uv run ruff format --check .
```

### Frontend (Node 20+)

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173, proxies /api to http://localhost:8000
npm test             # Vitest + Testing Library
npm run lint && npm run typecheck && npm run format:check
```

If port 8000 is taken, run the API elsewhere and point the proxy at it:
`uv run uvicorn app.main:app --port 8001` and `API_URL=http://localhost:8001 npm run dev`.

### Backend configuration

Configuration comes from environment variables (see `backend/app/config.py`):

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `sqlite:///./salary.db` | SQLAlchemy URL |
| `SEED_ON_STARTUP` | `false` | Seed employees on boot if the table is empty |
| `SEED_COUNT` | `10000` | How many employees to seed on startup |
