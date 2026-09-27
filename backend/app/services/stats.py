"""Pure statistics helpers. No database, no I/O: easy to test exhaustively.

SQLite has no MEDIAN/PERCENTILE_CONT, so these run over values fetched from one
grouped, sorted query (see docs/02-design.md, "Median computed in Python").
"""

import math
from collections.abc import Sequence
from dataclasses import dataclass


@dataclass(frozen=True)
class SalaryStats:
    count: int
    min: float
    max: float
    mean: float
    median: float

    def scaled(self, factor: float) -> "SalaryStats":
        """Convert currency. Exact for every field because each is linear in the values."""
        return SalaryStats(
            count=self.count,
            min=self.min * factor,
            max=self.max * factor,
            mean=self.mean * factor,
            median=self.median * factor,
        )


@dataclass(frozen=True)
class Bucket:
    start: float  # inclusive
    end: float  # exclusive
    count: int


def median(values: Sequence[float]) -> float:
    if not values:
        raise ValueError("median of empty sequence")
    ordered = sorted(values)
    mid = len(ordered) // 2
    if len(ordered) % 2:
        return float(ordered[mid])
    return (ordered[mid - 1] + ordered[mid]) / 2


def summarize(values: Sequence[float]) -> SalaryStats:
    if not values:
        raise ValueError("cannot summarize an empty sequence")
    return SalaryStats(
        count=len(values),
        min=float(min(values)),
        max=float(max(values)),
        mean=sum(values) / len(values),
        median=median(values),
    )


def nice_bucket_size(low: float, high: float, target_buckets: int = 15) -> float:
    """A 1/2/5 x 10^k width giving roughly `target_buckets` buckets, e.g. 10,000 or 250,000.

    Round widths make histogram labels readable ("$80k–$90k", not "$81,337–$92,110").
    """
    if target_buckets < 1:
        raise ValueError("target_buckets must be >= 1")
    span = high - low
    if span <= 0:
        return 1.0 if low == 0 else float(10 ** math.floor(math.log10(abs(low))))
    raw = span / target_buckets
    magnitude = 10 ** math.floor(math.log10(raw))
    return float(next(m * magnitude for m in (1, 2, 5, 10) if raw <= m * magnitude))


def histogram(values: Sequence[float], bucket_size: float) -> list[Bucket]:
    """Contiguous, bucket-aligned histogram. Empty buckets inside the range are kept
    so charts show gaps honestly."""
    if bucket_size <= 0:
        raise ValueError("bucket_size must be positive")
    if not values:
        return []

    first = math.floor(min(values) / bucket_size)
    last = math.floor(max(values) / bucket_size)
    counts = [0] * (last - first + 1)
    for value in values:
        counts[math.floor(value / bucket_size) - first] += 1

    return [
        Bucket(start=(first + i) * bucket_size, end=(first + i + 1) * bucket_size, count=n)
        for i, n in enumerate(counts)
    ]
