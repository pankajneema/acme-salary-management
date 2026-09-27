import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app


@pytest.fixture
def dist(tmp_path):
    (tmp_path / "index.html").write_text("<div id=root></div>")
    (tmp_path / "assets").mkdir()
    (tmp_path / "assets" / "index-abc123.js").write_text("console.log('app')")
    (tmp_path / "favicon.ico").write_bytes(b"icon")
    return tmp_path


@pytest.fixture
def client(dist):
    app = create_app(Settings(database_url="sqlite://", static_dir=dist))
    with TestClient(app) as test_client:
        yield test_client


def test_root_serves_the_app_shell(client):
    response = client.get("/")

    assert response.status_code == 200
    assert "id=root" in response.text
    assert response.headers["cache-control"] == "no-cache"


@pytest.mark.parametrize("path", ["/employees", "/insights?country=IN", "/some/deep/link"])
def test_client_side_routes_fall_back_to_the_app_shell(client, path):
    response = client.get(path)

    assert response.status_code == 200
    assert "id=root" in response.text


def test_fingerprinted_assets_are_cached_forever(client):
    response = client.get("/assets/index-abc123.js")

    assert response.status_code == 200
    assert "immutable" in response.headers["cache-control"]


def test_top_level_files_are_served_as_is(client):
    assert client.get("/favicon.ico").content == b"icon"


def test_api_still_works_alongside_the_app(client):
    assert client.get("/api/health").json() == {"status": "ok"}


@pytest.mark.parametrize("path", ["/api", "/api/unknown"])
def test_unknown_api_paths_are_json_404s_not_the_app_shell(client, path):
    response = client.get(path)

    assert response.status_code == 404
    assert response.json() == {"detail": "Not Found"}


def test_path_traversal_cannot_escape_the_static_dir(client):
    response = client.get("/..%2F..%2Fetc%2Fpasswd")

    assert "root:" not in response.text


def test_missing_index_fails_fast_at_startup(tmp_path):
    with pytest.raises(RuntimeError, match="index.html"):
        create_app(Settings(database_url="sqlite://", static_dir=tmp_path))
