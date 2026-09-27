# One image serves the API and the built React app (see docs/02-design.md).

# --- 1. Build the frontend -----------------------------------------------------------
FROM node:22-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- 2. Runtime: Python API + static bundle ------------------------------------------
FROM python:3.13-slim AS runtime
COPY --from=ghcr.io/astral-sh/uv:0.12 /uv /usr/local/bin/uv

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PYTHONUNBUFFERED=1 \
    PATH="/app/backend/.venv/bin:$PATH"

WORKDIR /app/backend
# Dependencies first so code changes don't invalidate this layer.
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --locked --no-dev
COPY backend/app ./app
COPY --from=frontend /app/frontend/dist /app/frontend/dist

RUN useradd --create-home --uid 1000 app && mkdir -p /data && chown app /data
USER app

# SQLite lives in /data. Without a persistent disk it resets on redeploy,
# and SEED_ON_STARTUP re-creates the 10k demo employees.
ENV DATABASE_URL=sqlite:////data/salary.db \
    STATIC_DIR=/app/frontend/dist \
    SEED_ON_STARTUP=true \
    PORT=8000

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s CMD python -c "import urllib.request,os; urllib.request.urlopen(f'http://localhost:{os.environ[\"PORT\"]}/api/health')"
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
