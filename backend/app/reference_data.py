"""Static reference data: countries (with an FX snapshot), departments and job titles.

FX rates are an illustrative fixed snapshot, not live rates, so reports are
deterministic (see docs/01-requirements.md, "Live FX rates").
"""

from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.models import Country

FX_SNAPSHOT_DATE = "2026-01-01"


@dataclass(frozen=True)
class CountryRef:
    code: str
    name: str
    currency: str
    usd_rate: float


COUNTRIES: tuple[CountryRef, ...] = (
    CountryRef("US", "United States", "USD", 1.0),
    CountryRef("GB", "United Kingdom", "GBP", 1.27),
    CountryRef("DE", "Germany", "EUR", 1.08),
    CountryRef("FR", "France", "EUR", 1.08),
    CountryRef("IN", "India", "INR", 0.012),
    CountryRef("CA", "Canada", "CAD", 0.73),
    CountryRef("AU", "Australia", "AUD", 0.66),
    CountryRef("SG", "Singapore", "SGD", 0.74),
    CountryRef("JP", "Japan", "JPY", 0.0067),
    CountryRef("BR", "Brazil", "BRL", 0.18),
)

# Job title -> department. Titles are free text in the API; this is the curated list the UI offers.
JOB_TITLES: dict[str, str] = {
    "Software Engineer": "Engineering",
    "Senior Software Engineer": "Engineering",
    "Engineering Manager": "Engineering",
    "QA Engineer": "Engineering",
    "DevOps Engineer": "Engineering",
    "Data Analyst": "Data",
    "Data Scientist": "Data",
    "Product Manager": "Product",
    "Product Designer": "Product",
    "Account Executive": "Sales",
    "Sales Manager": "Sales",
    "Marketing Specialist": "Marketing",
    "Marketing Manager": "Marketing",
    "Accountant": "Finance",
    "Financial Analyst": "Finance",
    "HR Generalist": "People",
    "Recruiter": "People",
    "Customer Support Specialist": "Customer Support",
    "Operations Coordinator": "Operations",
}

DEPARTMENTS: tuple[str, ...] = tuple(sorted(set(JOB_TITLES.values())))


def sync_countries(session: Session) -> None:
    """Upsert the country reference rows so the DB always matches the code."""
    for ref in COUNTRIES:
        session.merge(
            Country(code=ref.code, name=ref.name, currency=ref.currency, usd_rate=ref.usd_rate)
        )
    session.commit()
