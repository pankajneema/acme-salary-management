"""Employee queries and mutations. HTTP-agnostic: raises domain errors, never HTTPException."""

from collections.abc import Iterator
from dataclasses import dataclass
from typing import Literal
from uuid import uuid4

from sqlalchemy import Select, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, contains_eager

from app.models import Country, Employee
from app.schemas import EmployeeCreate, EmployeeUpdate


class EmployeeNotFoundError(Exception):
    pass


class DuplicateEmailError(Exception):
    pass


class UnknownCountryError(Exception):
    pass


SortField = Literal[
    "full_name",
    "employee_code",
    "job_title",
    "department",
    "country",
    "salary_usd",
    "hire_date",
]
SortOrder = Literal["asc", "desc"]

# Allow-list: user input selects a column, it never reaches ORDER BY as raw SQL.
# Salary sorts by the USD equivalent: local amounts across currencies aren't comparable.
_SORT_COLUMNS = {
    "full_name": Employee.full_name,
    "employee_code": Employee.employee_code,
    "job_title": Employee.job_title,
    "department": Employee.department,
    "country": Employee.country_code,
    "salary_usd": Employee.salary * Country.usd_rate,
    "hire_date": Employee.hire_date,
}


@dataclass(frozen=True)
class EmployeeFilters:
    search: str | None = None
    country: str | None = None
    department: str | None = None
    job_title: str | None = None


def _escape_like(term: str) -> str:
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _apply_filters(query: Select, filters: EmployeeFilters) -> Select:
    if filters.search and filters.search.strip():
        pattern = f"%{_escape_like(filters.search.strip())}%"
        query = query.where(
            or_(
                Employee.full_name.ilike(pattern, escape="\\"),
                Employee.email.ilike(pattern, escape="\\"),
                Employee.employee_code.ilike(pattern, escape="\\"),
            )
        )
    if filters.country:
        query = query.where(Employee.country_code == filters.country.upper())
    if filters.department:
        query = query.where(Employee.department == filters.department)
    if filters.job_title:
        query = query.where(Employee.job_title == filters.job_title)
    return query


def _ordered(query: Select, sort: SortField, order: SortOrder) -> Select:
    column = _SORT_COLUMNS[sort]
    primary = column.desc() if order == "desc" else column.asc()
    # Tie-break on id so pagination is stable when many rows share a value.
    # One explicit join serves both the salary_usd sort and loading employee.country.
    return (
        query.join(Employee.country)
        .options(contains_eager(Employee.country))
        .order_by(primary, Employee.id.asc())
    )


def list_employees(
    db: Session,
    filters: EmployeeFilters,
    *,
    sort: SortField = "full_name",
    order: SortOrder = "asc",
    page: int = 1,
    page_size: int = 25,
) -> tuple[list[Employee], int]:
    total = db.scalar(_apply_filters(select(func.count(Employee.id)), filters)) or 0
    query = _ordered(_apply_filters(select(Employee), filters), sort, order)
    items = db.scalars(query.limit(page_size).offset((page - 1) * page_size)).all()
    return list(items), total


def iter_employees(
    db: Session,
    filters: EmployeeFilters,
    *,
    sort: SortField = "full_name",
    order: SortOrder = "asc",
) -> Iterator[Employee]:
    """Stream every matching employee (for export) without loading them all at once."""
    query = _ordered(_apply_filters(select(Employee), filters), sort, order)
    yield from db.scalars(query.execution_options(yield_per=500))


def get_employee(db: Session, employee_id: int) -> Employee:
    employee = db.get(Employee, employee_id)
    if employee is None:
        raise EmployeeNotFoundError(employee_id)
    return employee


def create_employee(db: Session, data: EmployeeCreate) -> Employee:
    _ensure_country_exists(db, data.country_code)
    _ensure_email_available(db, data.email)

    # The code is derived from the id, which only exists after insert: use a unique placeholder.
    employee = Employee(**data.model_dump(), employee_code=f"TMP-{uuid4().hex[:16]}")
    db.add(employee)
    _flush_or_raise(db)
    employee.employee_code = format_employee_code(employee.id)
    db.commit()
    db.refresh(employee)
    return employee


def update_employee(db: Session, employee_id: int, data: EmployeeUpdate) -> Employee:
    employee = get_employee(db, employee_id)
    changes = data.model_dump(exclude_unset=True)

    if "country_code" in changes:
        _ensure_country_exists(db, changes["country_code"])
    if "email" in changes and changes["email"] != employee.email:
        _ensure_email_available(db, changes["email"])

    for field, value in changes.items():
        setattr(employee, field, value)
    _flush_or_raise(db)
    db.commit()
    db.refresh(employee)
    return employee


def delete_employee(db: Session, employee_id: int) -> None:
    employee = get_employee(db, employee_id)
    db.delete(employee)
    db.commit()


def format_employee_code(employee_id: int) -> str:
    return f"EMP-{employee_id:05d}"


def _ensure_country_exists(db: Session, code: str) -> None:
    if db.get(Country, code) is None:
        raise UnknownCountryError(code)


def _ensure_email_available(db: Session, email: str) -> None:
    if db.scalar(select(Employee.id).where(Employee.email == email)) is not None:
        raise DuplicateEmailError(email)


def _flush_or_raise(db: Session) -> None:
    # The pre-checks give friendly errors; the unique index is the real guarantee (races).
    try:
        db.flush()
    except IntegrityError as exc:
        db.rollback()
        if "email" in str(exc.orig):
            raise DuplicateEmailError from exc
        raise
