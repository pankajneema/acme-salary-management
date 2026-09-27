"""Serve the built React app from the same process as the API: one service, one URL, no CORS."""

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles


def mount_spa(app: FastAPI, static_dir: Path) -> None:
    static_dir = static_dir.resolve()
    index = static_dir / "index.html"
    if not index.is_file():
        raise RuntimeError(f"STATIC_DIR has no index.html: {static_dir}")

    # Vite fingerprints asset filenames, so they can be cached forever.
    assets = static_dir / "assets"
    if assets.is_dir():
        app.mount("/assets", _ImmutableStaticFiles(directory=assets), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str) -> FileResponse:
        # Unknown API paths must stay JSON 404s, not silently return the app shell.
        if path == "api" or path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not Found")
        candidate = (static_dir / path).resolve()
        if path and candidate.is_file() and candidate.is_relative_to(static_dir):
            return FileResponse(candidate)
        # Client-side routes (/employees, /insights?country=IN) all load the app shell.
        return FileResponse(index, headers={"Cache-Control": "no-cache"})


class _ImmutableStaticFiles(StaticFiles):
    async def get_response(self, path, scope):
        response = await super().get_response(path, scope)
        if response.status_code == 200:
            response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        return response
