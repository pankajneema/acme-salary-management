from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration, read from environment variables (or a local .env file)."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./salary.db"
    # Directory containing the built React app. When set, FastAPI serves it at "/".
    static_dir: Path | None = None
    # Seed 10k employees on startup if the employees table is empty (demo deployments).
    seed_on_startup: bool = False
    seed_count: int = 10_000
    # Allowed browser origins for local development (Vite dev server).
    cors_origins: list[str] = ["http://localhost:5173"]
