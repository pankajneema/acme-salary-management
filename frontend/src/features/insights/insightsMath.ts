import type { CountryInsight } from '../../api/types'
import { formatCompactMoney } from '../../lib/format'

export interface RangeGeometry {
  /** Percentages of the track width. */
  left: number
  width: number
  median: number
}

/**
 * Place a min–median–max range on a shared track, so ranges from different job titles
 * in the same country can be compared by eye.
 */
export function rangeGeometry(
  track: { min: number; max: number },
  stats: { min: number; median: number; max: number },
): RangeGeometry {
  const span = track.max - track.min
  const toPercent = (value: number) => (span > 0 ? ((value - track.min) / span) * 100 : 50)
  const left = toPercent(stats.min)
  return {
    left,
    width: Math.max(toPercent(stats.max) - left, 0),
    median: toPercent(stats.median),
  }
}

/** "$80K–$100K" */
export function bucketLabel(start: number, end: number, currency: string): string {
  return `${formatCompactMoney(start, currency)}–${formatCompactMoney(end, currency)}`
}

/** Countries ranked by median pay in USD: the one fair cross-country comparison. */
export function countriesByMedianUsd(countries: CountryInsight[]) {
  return [...countries]
    .sort((a, b) => b.usd.median - a.usd.median)
    .map((c) => ({
      country: c.country_name,
      median: c.usd.median,
      min: c.usd.min,
      max: c.usd.max,
      headcount: c.headcount,
    }))
}

/** The country with the most employees: a sensible default for the deep dive. */
export function largestCountry(countries: CountryInsight[]): string | undefined {
  return [...countries].sort((a, b) => b.headcount - a.headcount)[0]?.country_code
}
