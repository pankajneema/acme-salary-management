"""Deterministic demo seed: 10,000 employees across 10 countries.

Usage:
    uv run python -m app.seed                 # seed if the table is empty
    uv run python -m app.seed --reset         # wipe and re-seed
    uv run python -m app.seed --count 500 --seed 7

The same --seed always produces exactly the same employees, so demos, screenshots
and bug reports are reproducible.
"""

import argparse
import math
import random
import time
import unicodedata
from datetime import date, timedelta

from sqlalchemy import delete, func, insert, select
from sqlalchemy.orm import Session

from app.config import Settings
from app.db import Base, create_db_engine, create_session_factory
from app.models import Employee
from app.reference_data import COUNTRIES, JOB_TITLES, sync_countries
from app.seed_data import COUNTRY_PROFILES, JOB_PROFILES, NAMES_BY_REGION
from app.services.employees import format_employee_code

DEFAULT_COUNT = 10_000
DEFAULT_SEED = 42
EMAIL_DOMAIN = "acme.com"
# Fixed window, not relative to today, so the output never changes over time.
HIRE_WINDOW = (date(2012, 1, 1), date(2025, 12, 31))

_USD_RATES = {c.code: c.usd_rate for c in COUNTRIES}


def round_significant(value: float, digits: int = 4) -> int:
    """Round to `digits` significant figures, so pay looks like pay: 123,456 -> 123,500."""
    if value <= 0:
        raise ValueError("value must be positive")
    magnitude = math.floor(math.log10(value)) + 1
    step = 10 ** max(magnitude - digits, 0)
    return int(round(value / step) * step)


def slugify(text: str) -> str:
    """ASCII, lowercase, no spaces: 'Müller' -> 'muller', 'Wei Ling' -> 'weiling'."""
    ascii_text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return "".join(ch for ch in ascii_text.lower() if ch.isalnum())


def build_employees(count: int = DEFAULT_COUNT, seed: int = DEFAULT_SEED) -> list[dict]:
    """Pure function: same (count, seed) -> identical rows. No database access."""
    rng = random.Random(seed)
    countries = list(COUNTRY_PROFILES)
    country_weights = [COUNTRY_PROFILES[c][1] for c in countries]
    titles = list(JOB_PROFILES)
    title_weights = [JOB_PROFILES[t][0] for t in titles]
    hire_span_days = (HIRE_WINDOW[1] - HIRE_WINDOW[0]).days
    email_counts: dict[str, int] = {}

    rows = []
    for employee_id in range(1, count + 1):
        country = rng.choices(countries, country_weights)[0]
        region, _share, pay_factor = COUNTRY_PROFILES[country]
        first_names, last_names = NAMES_BY_REGION[region]
        first, last = rng.choice(first_names), rng.choice(last_names)

        title = rng.choices(titles, title_weights)[0]
        low, high = JOB_PROFILES[title][1]
        salary_usd = rng.uniform(low, high) * pay_factor

        local_part = f"{slugify(first)}.{slugify(last)}"
        email_counts[local_part] = email_counts.get(local_part, 0) + 1
        suffix = email_counts[local_part]
        email = f"{local_part}{suffix if suffix > 1 else ''}@{EMAIL_DOMAIN}"

        rows.append(
            {
                "id": employee_id,
                "employee_code": format_employee_code(employee_id),
                "full_name": f"{first} {last}",
                "email": email,
                "job_title": title,
                "department": JOB_TITLES[title],
                "country_code": country,
                "salary": round_significant(salary_usd / _USD_RATES[country]),
                "hire_date": HIRE_WINDOW[0] + timedelta(days=rng.randint(0, hire_span_days)),
            }
        )
    return rows


def seed_database(
    session: Session,
    *,
    count: int = DEFAULT_COUNT,
    seed: int = DEFAULT_SEED,
    reset: bool = False,
) -> int:
    """Insert seed employees. Returns how many were inserted (0 if data already exists)."""
    if reset:
        session.execute(delete(Employee))
    elif session.scalar(select(func.count(Employee.id))):
        return 0

    rows = build_employees(count, seed)
    # One executemany in one transaction: 10k rows in well under a second on SQLite.
    session.execute(insert(Employee), rows)
    session.commit()
    return len(rows)


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed the employees table.")
    parser.add_argument("--count", type=int, default=DEFAULT_COUNT)
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    parser.add_argument("--reset", action="store_true", help="delete existing employees first")
    args = parser.parse_args()

    engine = create_db_engine(Settings().database_url)
    Base.metadata.create_all(engine)
    with create_session_factory(engine)() as session:
        sync_countries(session)
        started = time.perf_counter()
        inserted = seed_database(session, count=args.count, seed=args.seed, reset=args.reset)
        elapsed = time.perf_counter() - started

    if inserted:
        print(f"Seeded {inserted:,} employees in {elapsed:.2f}s")
    else:
        print("Employees already exist; nothing seeded (use --reset to replace them).")


if __name__ == "__main__":
    main()
