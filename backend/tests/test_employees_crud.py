from datetime import date, timedelta

import pytest

from tests.factories import create_employee, employee_payload


class TestCreate:
    def test_returns_201_with_generated_code_and_currency_details(self, client):
        response = client.post(
            "/api/employees",
            json=employee_payload(country_code="IN", salary=2_500_000, full_name="Asha Rao"),
        )

        assert response.status_code == 201
        body = response.json()
        assert body["employee_code"] == f"EMP-{body['id']:05d}"
        assert body["full_name"] == "Asha Rao"
        assert body["currency"] == "INR"
        assert body["country_name"] == "India"
        assert body["salary_usd"] == 30_000  # 2,500,000 INR * 0.012

    def test_normalises_email_and_country_code(self, client):
        body = create_employee(client, email="Mixed.Case@ACME.com", country_code="gb")

        assert body["email"] == "mixed.case@acme.com"
        assert body["country_code"] == "GB"

    def test_rejects_duplicate_email_case_insensitively(self, client):
        create_employee(client, email="dup@acme.com")

        response = client.post("/api/employees", json=employee_payload(email="DUP@acme.com"))

        assert response.status_code == 409

    def test_rejects_unknown_country(self, client):
        response = client.post("/api/employees", json=employee_payload(country_code="ZZ"))

        assert response.status_code == 422
        assert response.json()["detail"] == "Unknown country code"

    @pytest.mark.parametrize(
        ("field", "value"),
        [
            ("salary", 0),
            ("salary", -5),
            ("salary", 12.5),
            ("email", "not-an-email"),
            ("full_name", "   "),
            ("country_code", "USA"),
            ("hire_date", (date.today() + timedelta(days=1)).isoformat()),
        ],
    )
    def test_rejects_invalid_field(self, client, field, value):
        response = client.post("/api/employees", json=employee_payload(**{field: value}))

        assert response.status_code == 422
        assert response.json()["detail"][0]["loc"][-1] == field

    def test_rejects_missing_required_field(self, client):
        payload = employee_payload()
        del payload["salary"]

        response = client.post("/api/employees", json=payload)

        assert response.status_code == 422


class TestRead:
    def test_get_returns_employee(self, client):
        created = create_employee(client)

        response = client.get(f"/api/employees/{created['id']}")

        assert response.status_code == 200
        assert response.json() == created

    def test_get_unknown_returns_404(self, client):
        assert client.get("/api/employees/999").status_code == 404


class TestUpdate:
    def test_patch_changes_only_given_fields(self, client):
        created = create_employee(client, salary=100_000, job_title="Software Engineer")

        response = client.patch(f"/api/employees/{created['id']}", json={"salary": 120_000})

        assert response.status_code == 200
        body = response.json()
        assert body["salary"] == 120_000
        assert body["job_title"] == "Software Engineer"
        assert body["employee_code"] == created["employee_code"]

    def test_changing_country_changes_currency(self, client):
        created = create_employee(client, country_code="US")

        body = client.patch(
            f"/api/employees/{created['id']}", json={"country_code": "DE", "salary": 80_000}
        ).json()

        assert body["currency"] == "EUR"
        assert body["salary_usd"] == 86_400

    def test_rejects_explicit_null(self, client):
        created = create_employee(client)

        response = client.patch(f"/api/employees/{created['id']}", json={"salary": None})

        assert response.status_code == 422

    def test_rejects_email_taken_by_someone_else(self, client):
        create_employee(client, email="taken@acme.com")
        other = create_employee(client)

        response = client.patch(f"/api/employees/{other['id']}", json={"email": "taken@acme.com"})

        assert response.status_code == 409

    def test_allows_keeping_own_email(self, client):
        created = create_employee(client, email="me@acme.com")

        response = client.patch(f"/api/employees/{created['id']}", json={"email": "me@acme.com"})

        assert response.status_code == 200

    def test_unknown_employee_returns_404(self, client):
        assert client.patch("/api/employees/999", json={"salary": 1}).status_code == 404


class TestDelete:
    def test_delete_removes_employee(self, client):
        created = create_employee(client)

        assert client.delete(f"/api/employees/{created['id']}").status_code == 204
        assert client.get(f"/api/employees/{created['id']}").status_code == 404

    def test_delete_unknown_returns_404(self, client):
        assert client.delete("/api/employees/999").status_code == 404
