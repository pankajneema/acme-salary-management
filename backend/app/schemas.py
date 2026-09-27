"""Pydantic models: the public API contract."""

from pydantic import BaseModel


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
