import csv
import io

import pytest

from tests.factories import create_employee


def list_employees(client, **params) -> dict:
    response = client.get("/api/employees", params=params)
    assert response.status_code == 200, response.text
    return response.json()


def names(page: dict) -> list[str]:
    return [e["full_name"] for e in page["items"]]


@pytest.fixture
def team(client):
    """A small, varied team: different countries, departments and currencies."""
    create_employee(client, full_name="Alice Smith", country_code="US", salary=150_000)
    create_employee(
        client,
        full_name="Bob Kumar",
        country_code="IN",
        salary=3_000_000,  # 36,000 USD
        job_title="Data Analyst",
        department="Data",
    )
    create_employee(
        client,
        full_name="Carla Weber",
        country_code="DE",
        salary=90_000,  # 97,200 USD
        email="carla.weber@acme.com",
    )


class TestPagination:
    def test_returns_page_metadata_and_total(self, client, team):
        page = list_employees(client, page=1, page_size=2)

        assert page["total"] == 3
        assert page["page"] == 1
        assert page["page_size"] == 2
        assert len(page["items"]) == 2

    def test_last_page_holds_the_remainder(self, client, team):
        page = list_employees(client, page=2, page_size=2)

        assert len(page["items"]) == 1

    def test_page_beyond_end_is_empty_not_an_error(self, client, team):
        page = list_employees(client, page=10, page_size=2)

        assert page["items"] == []
        assert page["total"] == 3

    @pytest.mark.parametrize("params", [{"page": 0}, {"page_size": 0}, {"page_size": 101}])
    def test_rejects_out_of_range_paging(self, client, params):
        assert client.get("/api/employees", params=params).status_code == 422


class TestFilters:
    def test_filter_by_country(self, client, team):
        assert names(list_employees(client, country="IN")) == ["Bob Kumar"]

    def test_country_filter_is_case_insensitive(self, client, team):
        assert names(list_employees(client, country="de")) == ["Carla Weber"]

    def test_filter_by_department(self, client, team):
        assert names(list_employees(client, department="Data")) == ["Bob Kumar"]

    def test_filter_by_job_title(self, client, team):
        page = list_employees(client, job_title="Software Engineer")

        assert names(page) == ["Alice Smith", "Carla Weber"]

    def test_filters_combine(self, client, team):
        page = list_employees(client, country="US", job_title="Data Analyst")

        assert page["total"] == 0

    @pytest.mark.parametrize("term", ["kumar", "KUMAR", "bob k"])
    def test_search_by_name_is_case_insensitive(self, client, team, term):
        assert names(list_employees(client, search=term)) == ["Bob Kumar"]

    def test_search_by_email(self, client, team):
        assert names(list_employees(client, search="carla.weber@")) == ["Carla Weber"]

    def test_search_by_employee_code(self, client, team):
        code = list_employees(client, search="Alice")["items"][0]["employee_code"]

        assert names(list_employees(client, search=code)) == ["Alice Smith"]

    def test_search_treats_wildcards_literally(self, client, team):
        assert list_employees(client, search="%")["total"] == 0
        assert list_employees(client, search="_")["total"] == 0


class TestSorting:
    def test_default_sort_is_name_ascending(self, client, team):
        assert names(list_employees(client)) == ["Alice Smith", "Bob Kumar", "Carla Weber"]

    def test_salary_sort_compares_usd_equivalents_not_local_amounts(self, client, team):
        # In local units Bob (3,000,000 INR) is "highest"; in USD he is lowest.
        page = list_employees(client, sort="salary_usd", order="desc")

        assert names(page) == ["Alice Smith", "Carla Weber", "Bob Kumar"]

    def test_rejects_unknown_sort_field(self, client):
        response = client.get("/api/employees", params={"sort": "salary; DROP TABLE employees"})

        assert response.status_code == 422


class TestCsvExport:
    def export(self, client, **params) -> list[dict]:
        response = client.get("/api/employees/export.csv", params=params)
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/csv")
        assert "attachment" in response.headers["content-disposition"]
        return list(csv.DictReader(io.StringIO(response.text)))

    def test_exports_filtered_rows_with_currency_columns(self, client, team):
        rows = self.export(client, country="IN")

        assert len(rows) == 1
        assert rows[0]["full_name"] == "Bob Kumar"
        assert rows[0]["currency"] == "INR"
        assert rows[0]["salary"] == "3000000"
        assert rows[0]["salary_usd"] == "36000"

    def test_exports_every_match_not_just_one_page(self, client):
        for _ in range(30):
            create_employee(client)

        assert len(self.export(client)) == 30

    def test_neutralises_spreadsheet_formulas(self, client):
        create_employee(client, full_name='=HYPERLINK("http://evil.test")')

        rows = self.export(client)

        assert rows[0]["full_name"].startswith("'=")
