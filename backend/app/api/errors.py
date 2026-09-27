"""Map domain errors raised by services to HTTP responses, in one place."""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.services.employees import DuplicateEmailError, EmployeeNotFoundError, UnknownCountryError

_ERRORS: dict[type[Exception], tuple[int, str]] = {
    EmployeeNotFoundError: (status.HTTP_404_NOT_FOUND, "Employee not found"),
    DuplicateEmailError: (status.HTTP_409_CONFLICT, "An employee with this email already exists"),
    UnknownCountryError: (status.HTTP_422_UNPROCESSABLE_CONTENT, "Unknown country code"),
}


def register_error_handlers(app: FastAPI) -> None:
    for error_type, (status_code, detail) in _ERRORS.items():

        async def handler(_request: Request, _exc: Exception, *, code=status_code, msg=detail):
            return JSONResponse(status_code=code, content={"detail": msg})

        app.add_exception_handler(error_type, handler)
