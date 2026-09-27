from fastapi import APIRouter
from sqlalchemy import select

from app.db import DbSession
from app.models import Country
from app.reference_data import DEPARTMENTS, FX_SNAPSHOT_DATE, JOB_TITLES
from app.schemas import CountryOut, MetaOut

router = APIRouter(prefix="/api", tags=["meta"])


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/meta", response_model=MetaOut)
def meta(db: DbSession) -> MetaOut:
    """Reference data for UI dropdowns and currency display."""
    countries = db.scalars(select(Country).order_by(Country.name)).all()
    return MetaOut(
        countries=[CountryOut.model_validate(c, from_attributes=True) for c in countries],
        departments=list(DEPARTMENTS),
        job_titles=JOB_TITLES,
        fx_snapshot_date=FX_SNAPSHOT_DATE,
    )
