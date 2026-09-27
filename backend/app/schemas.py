"""Pydantic models: the public API contract."""

from datetime import date, datetime
from typing import Annotated, Self

from pydantic import BaseModel, EmailStr, Field, StringConstraints, field_validator, model_validator

from app.models import Employee
from app.services.stats import SalaryStats

Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
Label = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
CountryCode = Annotated[
    str, StringConstraints(strip_whitespace=True, to_upper=True, pattern=r"^[A-Za-z]{2}$")
]
# Annual gross salary in whole units of local currency. The upper bound only rejects typos.
Salary = Annotated[int, Field(gt=0, le=1_000_000_000_000)]


class CountryOut(BaseModel):
    code: str
    name: str
    currency: str
    usd_rate: float


class MetaOut(BaseModel):
    countries: list[CountryOut]
    departments: list[str]
    job_titles: dict[str, str]
    fx_snapshot_date: str


def _not_in_future(value: date | None) -> date | None:
    if value is not None and value > date.today():
        raise ValueError("hire_date cannot be in the future")
    return value


def _normalise_email(value: str | None) -> str | None:
    return value.lower() if value is not None else None


class EmployeeCreate(BaseModel):
    full_name: Name
    email: EmailStr
    job_title: Label
    department: Label
    country_code: CountryCode
    salary: Salary
    hire_date: date

    _check_hire_date = field_validator("hire_date")(_not_in_future)
    _lower_email = field_validator("email")(_normalise_email)


class EmployeeUpdate(BaseModel):
    """Partial update: only fields present in the request body are changed."""

    full_name: Name | None = None
    email: EmailStr | None = None
    job_title: Label | None = None
    department: Label | None = None
    country_code: CountryCode | None = None
    salary: Salary | None = None
    hire_date: date | None = None

    _check_hire_date = field_validator("hire_date")(_not_in_future)
    _lower_email = field_validator("email")(_normalise_email)

    @model_validator(mode="after")
    def _reject_explicit_nulls(self) -> Self:
        nulls = [name for name in self.model_fields_set if getattr(self, name) is None]
        if nulls:
            raise ValueError(f"fields cannot be null: {', '.join(sorted(nulls))}")
        return self


class EmployeeOut(BaseModel):
    id: int
    employee_code: str
    full_name: str
    email: str
    job_title: str
    department: str
    country_code: str
    country_name: str
    currency: str
    salary: int
    salary_usd: int
    hire_date: date
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_model(cls, employee: Employee) -> Self:
        country = employee.country
        return cls(
            id=employee.id,
            employee_code=employee.employee_code,
            full_name=employee.full_name,
            email=employee.email,
            job_title=employee.job_title,
            department=employee.department,
            country_code=employee.country_code,
            country_name=country.name,
            currency=country.currency,
            salary=employee.salary,
            salary_usd=round(employee.salary * country.usd_rate),
            hire_date=employee.hire_date,
            created_at=employee.created_at,
            updated_at=employee.updated_at,
        )


class EmployeePage(BaseModel):
    items: list[EmployeeOut]
    total: int
    page: int
    page_size: int


# --- Insights -------------------------------------------------------------------------
# Money is rounded to whole currency units at the API edge; services keep full precision.


class StatsOut(BaseModel):
    count: int
    min: int
    max: int
    mean: int
    median: int

    @classmethod
    def from_stats(cls, stats: SalaryStats) -> Self:
        return cls(
            count=stats.count,
            min=round(stats.min),
            max=round(stats.max),
            mean=round(stats.mean),
            median=round(stats.median),
        )


class CountryInsightOut(BaseModel):
    country_code: str
    country_name: str
    currency: str
    headcount: int
    local: StatsOut
    usd: StatsOut


class JobTitleInsightOut(BaseModel):
    job_title: str
    department: str
    headcount: int
    local: StatsOut
    usd: StatsOut


class CountryJobTitlesOut(BaseModel):
    country_code: str
    country_name: str
    currency: str
    job_titles: list[JobTitleInsightOut]


class DepartmentInsightOut(BaseModel):
    department: str
    headcount: int
    total_payroll_usd: int
    median_salary_usd: int


class SummaryOut(BaseModel):
    headcount: int
    country_count: int
    total_payroll_usd: int
    salary_usd: StatsOut | None
    departments: list[DepartmentInsightOut]


class BucketOut(BaseModel):
    start: float
    end: float
    count: int


class DistributionOut(BaseModel):
    currency: str
    bucket_size: float
    buckets: list[BucketOut]
