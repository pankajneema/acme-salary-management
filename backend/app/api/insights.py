from typing import Annotated

from fastapi import APIRouter, Query

from app.db import DbSession
from app.schemas import (
    BucketOut,
    CountryInsightOut,
    CountryJobTitlesOut,
    DepartmentInsightOut,
    DistributionOut,
    JobTitleInsightOut,
    StatsOut,
    SummaryOut,
)
from app.services import insights as service

router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.get("/summary", response_model=SummaryOut)
def summary(db: DbSession) -> SummaryOut:
    result = service.org_summary(db)
    return SummaryOut(
        headcount=result.headcount,
        country_count=result.country_count,
        total_payroll_usd=round(result.total_payroll_usd),
        salary_usd=StatsOut.from_stats(result.salary_usd) if result.salary_usd else None,
        departments=[
            DepartmentInsightOut(
                department=d.department,
                headcount=d.headcount,
                total_payroll_usd=round(d.total_payroll_usd),
                median_salary_usd=round(d.median_salary_usd),
            )
            for d in result.departments
        ],
    )


@router.get("/countries", response_model=list[CountryInsightOut])
def countries(db: DbSession) -> list[CountryInsightOut]:
    return [
        CountryInsightOut(
            country_code=c.country_code,
            country_name=c.country_name,
            currency=c.currency,
            headcount=c.local.count,
            local=StatsOut.from_stats(c.local),
            usd=StatsOut.from_stats(c.usd),
        )
        for c in service.country_insights(db)
    ]


@router.get("/countries/{country_code}/job-titles", response_model=CountryJobTitlesOut)
def job_titles(db: DbSession, country_code: str) -> CountryJobTitlesOut:
    country, insights = service.job_title_insights(db, country_code)
    return CountryJobTitlesOut(
        country_code=country.code,
        country_name=country.name,
        currency=country.currency,
        job_titles=[
            JobTitleInsightOut(
                job_title=j.job_title,
                department=j.department,
                headcount=j.local.count,
                local=StatsOut.from_stats(j.local),
                usd=StatsOut.from_stats(j.usd),
            )
            for j in insights
        ],
    )


@router.get("/distribution", response_model=DistributionOut)
def distribution(
    db: DbSession,
    country: Annotated[str | None, Query(min_length=2, max_length=2)] = None,
) -> DistributionOut:
    result = service.salary_distribution(db, country)
    return DistributionOut(
        currency=result.currency,
        bucket_size=result.bucket_size,
        buckets=[BucketOut(start=b.start, end=b.end, count=b.count) for b in result.buckets],
    )
