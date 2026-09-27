from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Index, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Country(Base):
    """Reference table. Currency lives here so an employee's currency can't disagree with
    their country. `usd_rate` is a dated snapshot: 1 unit of local currency = usd_rate USD."""

    __tablename__ = "countries"

    code: Mapped[str] = mapped_column(String(2), primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    currency: Mapped[str] = mapped_column(String(3))
    usd_rate: Mapped[float] = mapped_column(Float)


class Employee(Base):
    __tablename__ = "employees"
    __table_args__ = (Index("ix_employees_country_job_title", "country_code", "job_title"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_code: Mapped[str] = mapped_column(String(20), unique=True)
    full_name: Mapped[str] = mapped_column(String(200), index=True)
    email: Mapped[str] = mapped_column(String(254), unique=True)
    job_title: Mapped[str] = mapped_column(String(100), index=True)
    department: Mapped[str] = mapped_column(String(100), index=True)
    country_code: Mapped[str] = mapped_column(ForeignKey("countries.code"), index=True)
    # Annual gross base salary in whole units of the country's currency.
    salary: Mapped[int] = mapped_column(Integer)
    hire_date: Mapped[date] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    country: Mapped[Country] = relationship(lazy="joined")
