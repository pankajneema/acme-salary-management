"""Aggregations that answer "how does the org pay people?".

Each function runs one query that returns (group, salary) rows sorted by group, then
groups in Python and hands the values to the pure helpers in `stats`. At 10k rows this
is ~10 ms and gives exact medians, which SQLite can't compute natively.
"""

from dataclasses import dataclass
from itertools import groupby

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Country, Employee
from app.services.stats import Bucket, SalaryStats, histogram, nice_bucket_size, summarize


class CountryNotFoundError(Exception):
    pass


@dataclass(frozen=True)
class CountryInsight:
    country_code: str
    country_name: str
    currency: str
    local: SalaryStats
    usd: SalaryStats


@dataclass(frozen=True)
class JobTitleInsight:
    job_title: str
    department: str
    local: SalaryStats
    usd: SalaryStats


@dataclass(frozen=True)
class DepartmentInsight:
    department: str
    headcount: int
    total_payroll_usd: float
    median_salary_usd: float


@dataclass(frozen=True)
class OrgSummary:
    headcount: int
    country_count: int
    total_payroll_usd: float
    salary_usd: SalaryStats | None  # None when there are no employees
    departments: list[DepartmentInsight]


@dataclass(frozen=True)
class Distribution:
    currency: str
    bucket_size: float
    buckets: list[Bucket]


def country_insights(db: Session) -> list[CountryInsight]:
    """Salary stats per country, in local currency and USD. Countries without staff are omitted."""
    rows = db.execute(
        select(Country.code, Country.name, Country.currency, Country.usd_rate, Employee.salary)
        .join(Employee, Employee.country_code == Country.code)
        .order_by(Country.name, Employee.salary)
    ).all()

    insights = []
    for (code, name, currency, usd_rate), group in groupby(rows, key=lambda r: tuple(r[:4])):
        local = summarize([row.salary for row in group])
        insights.append(CountryInsight(code, name, currency, local, local.scaled(usd_rate)))
    return insights


def job_title_insights(db: Session, country_code: str) -> tuple[Country, list[JobTitleInsight]]:
    """Salary stats per job title within one country, highest median first."""
    country = db.get(Country, country_code.upper())
    if country is None:
        raise CountryNotFoundError(country_code)

    rows = db.execute(
        select(Employee.job_title, Employee.department, Employee.salary)
        .where(Employee.country_code == country.code)
        .order_by(Employee.job_title, Employee.department, Employee.salary)
    ).all()

    insights = []
    for (title, department), group in groupby(rows, key=lambda r: (r.job_title, r.department)):
        local = summarize([row.salary for row in group])
        insights.append(JobTitleInsight(title, department, local, local.scaled(country.usd_rate)))
    insights.sort(key=lambda i: (-i.local.median, i.job_title))
    return country, insights


def org_summary(db: Session) -> OrgSummary:
    rows = db.execute(
        select(Employee.department, Employee.country_code, Employee.salary * Country.usd_rate)
        .join(Employee.country)
        .order_by(Employee.department)
    ).all()
    if not rows:
        return OrgSummary(0, 0, 0.0, None, [])

    departments = []
    for department, group in groupby(rows, key=lambda r: r[0]):
        salaries = [row[2] for row in group]
        stats = summarize(salaries)
        departments.append(DepartmentInsight(department, stats.count, sum(salaries), stats.median))
    departments.sort(key=lambda d: -d.total_payroll_usd)

    all_usd = [row[2] for row in rows]
    return OrgSummary(
        headcount=len(rows),
        country_count=len({row[1] for row in rows}),
        total_payroll_usd=sum(all_usd),
        salary_usd=summarize(all_usd),
        departments=departments,
    )


def salary_distribution(db: Session, country_code: str | None = None) -> Distribution:
    """Histogram of salaries: in local currency for one country, otherwise in USD."""
    if country_code:
        country = db.get(Country, country_code.upper())
        if country is None:
            raise CountryNotFoundError(country_code)
        currency = country.currency
        values = db.scalars(
            select(Employee.salary).where(Employee.country_code == country.code)
        ).all()
    else:
        currency = "USD"
        values = db.scalars(select(Employee.salary * Country.usd_rate).join(Employee.country)).all()

    if not values:
        return Distribution(currency, 0, [])
    bucket_size = nice_bucket_size(min(values), max(values))
    return Distribution(currency, bucket_size, histogram(values, bucket_size))
