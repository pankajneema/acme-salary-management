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
uv run uvicorn app.main:app --reload      # http://localhost:8000/docs
uv run pytest                             # tests
uv run ruff check . && uv run ruff format --check .
```

Configuration comes from environment variables (see `backend/app/config.py`):

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `sqlite:///./salary.db` | SQLAlchemy URL |
