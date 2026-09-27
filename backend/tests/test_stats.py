import pytest

from app.services.stats import (
    Bucket,
    SalaryStats,
    histogram,
    median,
    nice_bucket_size,
    summarize,
)


class TestMedian:
    def test_odd_count_is_middle_value(self):
        assert median([5, 1, 3]) == 3

    def test_even_count_is_mean_of_middle_two(self):
        assert median([4, 1, 3, 2]) == 2.5

    def test_single_value(self):
        assert median([7]) == 7

    def test_does_not_mutate_input(self):
        values = [3, 1, 2]
        median(values)
        assert values == [3, 1, 2]

    def test_is_robust_to_outliers_unlike_mean(self):
        salaries = [50_000, 52_000, 55_000, 58_000, 2_000_000]

        assert median(salaries) == 55_000
        assert summarize(salaries).mean > 400_000

    def test_empty_raises(self):
        with pytest.raises(ValueError):
            median([])


class TestSummarize:
    def test_computes_all_fields(self):
        assert summarize([10, 20, 30, 40]) == SalaryStats(
            count=4, min=10, max=40, mean=25, median=25
        )

    def test_empty_raises(self):
        with pytest.raises(ValueError):
            summarize([])

    def test_scaled_converts_every_amount_but_not_count(self):
        stats = summarize([100, 200, 300]).scaled(0.5)

        assert stats == SalaryStats(count=3, min=50, max=150, mean=100, median=100)


class TestNiceBucketSize:
    @pytest.mark.parametrize(
        ("low", "high", "expected"),
        [
            (0, 150_000, 10_000),
            (30_000, 240_000, 20_000),
            (1_000_000, 6_000_000, 500_000),
            (0, 7, 0.5),
        ],
    )
    def test_picks_round_widths(self, low, high, expected):
        assert nice_bucket_size(low, high) == expected

    def test_width_gives_at_most_target_buckets(self):
        size = nice_bucket_size(12_345, 987_654, target_buckets=15)

        assert (987_654 - 12_345) / size <= 15

    def test_zero_span_returns_positive_width(self):
        assert nice_bucket_size(80_000, 80_000) == 10_000

    def test_rejects_non_positive_target(self):
        with pytest.raises(ValueError):
            nice_bucket_size(0, 10, target_buckets=0)


class TestHistogram:
    def test_counts_values_into_aligned_buckets(self):
        assert histogram([5, 12, 15, 19, 31], bucket_size=10) == [
            Bucket(0, 10, 1),
            Bucket(10, 20, 3),
            Bucket(20, 30, 0),  # empty gaps are kept
            Bucket(30, 40, 1),
        ]

    def test_boundary_value_belongs_to_upper_bucket(self):
        assert histogram([10], bucket_size=10) == [Bucket(10, 20, 1)]

    def test_bucket_counts_sum_to_input_size(self):
        values = [41_000, 55_500, 99_999, 100_000, 180_250]

        assert sum(b.count for b in histogram(values, 20_000)) == len(values)

    def test_empty_input_gives_no_buckets(self):
        assert histogram([], bucket_size=10) == []

    def test_rejects_non_positive_bucket_size(self):
        with pytest.raises(ValueError):
            histogram([1], bucket_size=0)
