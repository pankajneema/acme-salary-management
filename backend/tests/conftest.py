from collections.abc import Iterator

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.config import Settings
from app.main import create_app


@pytest.fixture
def app() -> FastAPI:
    # Fresh in-memory database per test: fast, isolated, no files left behind.
    return create_app(Settings(database_url="sqlite://", seed_on_startup=False))


@pytest.fixture
def client(app: FastAPI) -> Iterator[TestClient]:
    with TestClient(app) as test_client:  # context manager runs the lifespan (schema + countries)
        yield test_client


@pytest.fixture
def db(app: FastAPI, client: TestClient) -> Iterator[Session]:
    with app.state.session_factory() as session:
        yield session
