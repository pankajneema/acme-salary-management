import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select

from app.config import Settings
from app.main import create_app
from app.models import Employee
from app.reference_data import COUNTRIES, JOB_TITLES
from app.seed import build_employees, round_significant, seed_database, slugify
from app.seed_data import COUNTRY_PROFILES, JOB_PROFILES
from tests.factories import create_employee

USD_RATES = {c.code: c.usd_rate for c in COUNTRIES}


class TestBuildEmployees:
    def test_same_seed_produces_identical_rows(self):
        assert build_employees(200, seed=7) == build_employees(200, seed=7)

    def test_different_seed_produces_different_rows(self):
        assert build_employees(200, seed=7) != build_employees(200, seed=8)

    def test_produces_requested_count_with_sequential_codes(self):
        rows = build_employees(50)

        assert len(rows) == 50
        assert [r["employee_code"] for r in rows[:3]] == ["EMP-00001", "EMP-00002", "EMP-00003"]

    def test_emails_are_unique_even_with_repeated_names(self):
        rows = build_employees(3_000)  # far more rows than name combinations per region

        emails = [r["email"] for r in rows]
        assert len(set(emails)) == len(emails)

    def test_rows_only_use_reference_countries_and_job_titles(self):
        for row in build_employees(1_000):
            assert row["country_code"] in USD_RATES
            assert JOB_TITLES[row["job_title"]] == row["department"]

    def test_salaries_fall_within_the_job_band_for_the_country(self):
        for row in build_employees(1_000):
            low, high = JOB_PROFILES[row["job_title"]][1]
            pay_factor = COUNTRY_PROFILES[row["country_code"]][2]
            salary_usd = row["salary"] * USD_RATES[row["country_code"]]
            # 0.1% tolerance for rounding to 4 significant figures.
            assert low * pay_factor * 0.999 <= salary_usd <= high * pay_factor * 1.001

    def test_every_country_and_job_title_is_represented_at_full_size(self):
        rows = build_employees()

        assert {r["country_code"] for r in rows} == set(USD_RATES)
        assert {r["job_title"] for r in rows} == set(JOB_TITLES)


class TestHelpers:
    @pytest.mark.parametrize(
        ("value", "expected"),
        [(123_456.7, 123_500), (3_456_789, 3_457_000), (98_765.4, 98_770), (42.4, 42)],
    )
    def test_round_significant(self, value, expected):
        assert round_significant(value) == expected

    def test_round_significant_rejects_non_positive(self):
        with pytest.raises(ValueError):
            round_significant(0)

    @pytest.mark.parametrize(
        ("text", "expected"), [("Müller", "muller"), ("Wei Ling", "weiling"), ("Chloé", "chloe")]
    )
    def test_slugify_makes_ascii_email_parts(self, text, expected):
        assert slugify(text) == expected


def count_employees(db) -> int:
    return db.scalar(select(func.count(Employee.id)))


class TestSeedDatabase:
    def test_inserts_rows(self, db):
        assert seed_database(db, count=100) == 100
        assert count_employees(db) == 100

    def test_is_a_no_op_when_employees_exist(self, db):
        seed_database(db, count=100)

        assert seed_database(db, count=100) == 0
        assert count_employees(db) == 100

    def test_reset_replaces_existing_rows(self, db):
        seed_database(db, count=100)

        assert seed_database(db, count=40, reset=True) == 40
        assert count_employees(db) == 40

    def test_seeded_rows_are_served_by_the_api(self, client, db):
        seed_database(db, count=30)

        body = client.get("/api/employees", params={"page_size": 5}).json()

        assert body["total"] == 30
        assert all(item["salary_usd"] > 0 for item in body["items"])

    def test_new_employees_get_codes_after_the_seeded_ones(self, client, db):
        seed_database(db, count=30)

        assert create_employee(client)["employee_code"] == "EMP-00031"


def test_app_seeds_on_startup_when_enabled():
    app = create_app(Settings(database_url="sqlite://", seed_on_startup=True, seed_count=25))

    with TestClient(app) as client:
        assert client.get("/api/employees").json()["total"] == 25
