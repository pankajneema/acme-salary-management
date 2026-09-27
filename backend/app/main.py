from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import employees, insights, meta
from app.api.errors import register_error_handlers
from app.config import Settings
from app.db import Base, create_db_engine, create_session_factory
from app.reference_data import sync_countries
from app.seed import seed_database
from app.spa import mount_spa


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings()
    engine = create_db_engine(settings.database_url)
    session_factory = create_session_factory(engine)

    @asynccontextmanager
    async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
        Base.metadata.create_all(engine)
        with session_factory() as session:
            sync_countries(session)
            if settings.seed_on_startup:
                # No-op when employees already exist, so restarts never duplicate data.
                seed_database(session, count=settings.seed_count)
        yield
        engine.dispose()

    app = FastAPI(title="ACME Salary Management", version="0.1.0", lifespan=lifespan)
    app.state.settings = settings
    app.state.session_factory = session_factory

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    register_error_handlers(app)
    app.include_router(meta.router)
    app.include_router(employees.router)
    app.include_router(insights.router)
    if settings.static_dir:
        mount_spa(app, settings.static_dir)  # last: its catch-all must not shadow the API
    return app


app = create_app()
