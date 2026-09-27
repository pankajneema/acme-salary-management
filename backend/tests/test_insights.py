"""Insights API tests over a tiny dataset whose answers are easy to verify by hand.

US (USD): Software Engineer 100k, 200k · Product Manager 300k
IN (INR): Data Analyst 1,000,000 and 2,000,000  -> 12k and 24k USD (rate 0.012)
DE (EUR): Software Engineer 50,000               -> 54k USD (rate 1.08)
"""

import pytest

from app.seed import seed_database
from tests.factories import create_employee


@pytest.fixture
def org(client):
    create_employee(client, country_code="US", salary=100_000)
    create_employee(client, country_code="US", salary=200_000)
    create_employee(
        client,
        country_code="US",
        salary=300_000,
        job_title="Product Manager",
        department="Product",
    )
    for salary in (1_000_000, 2_000_000):
        create_employee(
            client,
            country_code="IN",
            salary=salary,
            job_title="Data Analyst",
            department="Data",
        )
    create_employee(client, country_code="DE", salary=50_000)


def get(client, path, **params):
    response = client.get(path, params=params)
    assert response.status_code == 200, response.text
    return response.json()


class TestCountries:
    def test_lists_only_countries_with_staff_sorted_by_name(self, client, org):
        body = get(client, "/api/insights/countries")

        assert [c["country_name"] for c in body] == ["Germany", "India", "United States"]

    def test_reports_min_max_mean_median_in_local_currency(self, client, org):
        us = next(c for c in get(client, "/api/insights/countries") if c["country_code"] == "US")

        assert us["headcount"] == 3
        assert us["currency"] == "USD"
        assert us["local"] == {
            "count": 3,
            "min": 100_000,
            "max": 300_000,
            "mean": 200_000,
            "median": 200_000,
        }

    def test_converts_stats_to_usd(self, client, org):
        india = next(c for c in get(client, "/api/insights/countries") if c["country_code"] == "IN")

        assert india["local"]["median"] == 1_500_000
        assert india["usd"]["median"] == 18_000
        assert india["usd"]["min"] == 12_000

    def test_empty_org_returns_empty_list(self, client):
        assert get(client, "/api/insights/countries") == []


class TestJobTitlesInCountry:
    def test_groups_by_title_highest_median_first(self, client, org):
        body = get(client, "/api/insights/countries/US/job-titles")

        assert body["country_name"] == "United States"
        titles = [
            (j["job_title"], j["headcount"], j["local"]["median"]) for j in body["job_titles"]
        ]
        assert titles == [("Product Manager", 1, 300_000), ("Software Engineer", 2, 150_000)]

    def test_country_code_is_case_insensitive(self, client, org):
        assert get(client, "/api/insights/countries/in/job-titles")["currency"] == "INR"

    def test_country_without_staff_has_no_titles(self, client, org):
        assert get(client, "/api/insights/countries/GB/job-titles")["job_titles"] == []

    def test_unknown_country_returns_404(self, client):
        assert client.get("/api/insights/countries/ZZ/job-titles").status_code == 404


class TestSummary:
    def test_totals_are_in_usd(self, client, org):
        body = get(client, "/api/insights/summary")

        assert body["headcount"] == 6
        assert body["country_count"] == 3
        assert body["total_payroll_usd"] == 600_000 + 36_000 + 54_000
        # USD salaries sorted: 12k, 24k, 54k, 100k, 200k, 300k -> median (54k + 100k) / 2
        assert body["salary_usd"]["median"] == 77_000

    def test_departments_sorted_by_payroll(self, client, org):
        departments = get(client, "/api/insights/summary")["departments"]

        assert [(d["department"], d["headcount"], d["total_payroll_usd"]) for d in departments] == [
            ("Engineering", 3, 354_000),
            ("Product", 1, 300_000),
            ("Data", 2, 36_000),
        ]

    def test_empty_org(self, client):
        body = get(client, "/api/insights/summary")

        assert body["headcount"] == 0
        assert body["salary_usd"] is None
        assert body["departments"] == []


class TestDistribution:
    def test_org_wide_histogram_is_in_usd_with_round_buckets(self, client, org):
        body = get(client, "/api/insights/distribution")

        assert body["currency"] == "USD"
        assert body["bucket_size"] == 20_000
        assert sum(b["count"] for b in body["buckets"]) == 6
        assert body["buckets"][0]["start"] == 0

    def test_country_histogram_is_in_local_currency(self, client, org):
        body = get(client, "/api/insights/distribution", country="IN")

        assert body["currency"] == "INR"
        assert sum(b["count"] for b in body["buckets"]) == 2

    def test_country_without_staff_has_no_buckets(self, client, org):
        assert get(client, "/api/insights/distribution", country="GB")["buckets"] == []

    def test_unknown_country_returns_404(self, client):
        assert client.get("/api/insights/distribution", params={"country": "ZZ"}).status_code == 404


def test_insights_are_consistent_on_seeded_data(client, db):
    seed_database(db, count=2_000)

    summary = get(client, "/api/insights/summary")
    countries = get(client, "/api/insights/countries")

    assert sum(c["headcount"] for c in countries) == summary["headcount"] == 2_000
    assert sum(d["headcount"] for d in summary["departments"]) == 2_000
    assert sum(b["count"] for b in get(client, "/api/insights/distribution")["buckets"]) == 2_000
    for country in countries:
        stats = country["local"]
        assert stats["min"] <= stats["median"] <= stats["max"]
        assert stats["min"] <= stats["mean"] <= stats["max"]
