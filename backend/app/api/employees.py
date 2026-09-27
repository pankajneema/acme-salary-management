import csv
import io
from collections.abc import Iterator
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request, Response, status
from fastapi.responses import StreamingResponse

from app.db import DbSession
from app.schemas import EmployeeCreate, EmployeeOut, EmployeePage, EmployeeUpdate
from app.services import employees as service
from app.services.employees import EmployeeFilters, SortField, SortOrder

router = APIRouter(prefix="/api/employees", tags=["employees"])


def employee_filters(
    search: Annotated[str | None, Query(max_length=100)] = None,
    country: Annotated[str | None, Query(min_length=2, max_length=2)] = None,
    department: str | None = None,
    job_title: str | None = None,
) -> EmployeeFilters:
    return EmployeeFilters(
        search=search, country=country, department=department, job_title=job_title
    )


Filters = Annotated[EmployeeFilters, Depends(employee_filters)]


@router.get("", response_model=EmployeePage)
def list_employees(
    db: DbSession,
    filters: Filters,
    sort: SortField = "full_name",
    order: SortOrder = "asc",
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 25,
) -> EmployeePage:
    items, total = service.list_employees(
        db, filters, sort=sort, order=order, page=page, page_size=page_size
    )
    return EmployeePage(
        items=[EmployeeOut.from_model(e) for e in items],
        total=total,
        page=page,
        page_size=page_size,
    )


CSV_COLUMNS = [
    "employee_code",
    "full_name",
    "email",
    "job_title",
    "department",
    "country_code",
    "country_name",
    "currency",
    "salary",
    "salary_usd",
    "hire_date",
]


def csv_safe(value: object) -> object:
    """Neutralise spreadsheet formula injection (a name like '=HYPERLINK(...)')."""
    if isinstance(value, str) and value[:1] in ("=", "+", "-", "@", "\t", "\r"):
        return "'" + value
    return value


@router.get("/export.csv")
def export_csv(
    request: Request, filters: Filters, sort: SortField = "full_name", order: SortOrder = "asc"
) -> StreamingResponse:
    session_factory = request.app.state.session_factory

    def rows() -> Iterator[str]:
        # The generator owns its session: it runs after the request dependencies have closed.
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(CSV_COLUMNS)
        with session_factory() as db:
            for employee in service.iter_employees(db, filters, sort=sort, order=order):
                out = EmployeeOut.from_model(employee).model_dump()
                writer.writerow([csv_safe(out[column]) for column in CSV_COLUMNS])
                if buffer.tell() > 64 * 1024:
                    yield buffer.getvalue()
                    buffer.seek(0)
                    buffer.truncate()
        yield buffer.getvalue()

    return StreamingResponse(
        rows(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="employees.csv"'},
    )


@router.get("/{employee_id}", response_model=EmployeeOut)
def get_employee(db: DbSession, employee_id: int) -> EmployeeOut:
    return EmployeeOut.from_model(service.get_employee(db, employee_id))


@router.post("", response_model=EmployeeOut, status_code=status.HTTP_201_CREATED)
def create_employee(db: DbSession, payload: EmployeeCreate) -> EmployeeOut:
    return EmployeeOut.from_model(service.create_employee(db, payload))


@router.patch("/{employee_id}", response_model=EmployeeOut)
def update_employee(db: DbSession, employee_id: int, payload: EmployeeUpdate) -> EmployeeOut:
    return EmployeeOut.from_model(service.update_employee(db, employee_id, payload))


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(db: DbSession, employee_id: int) -> Response:
    service.delete_employee(db, employee_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
