from app.reference_data import COUNTRIES, DEPARTMENTS


def test_health_returns_ok(client):
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_meta_lists_every_reference_country_with_currency(client):
    body = client.get("/api/meta").json()

    codes = {c["code"] for c in body["countries"]}
    assert codes == {c.code for c in COUNTRIES}
    india = next(c for c in body["countries"] if c["code"] == "IN")
    assert india["currency"] == "INR"


def test_meta_lists_departments_and_job_titles(client):
    body = client.get("/api/meta").json()

    assert body["departments"] == list(DEPARTMENTS)
    assert body["job_titles"]["Data Scientist"] == "Data"
