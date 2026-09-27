import type { CountryInsight } from '../../api/types'
import { bucketLabel, countriesByMedianUsd, largestCountry, rangeGeometry } from './insightsMath'

const stats = (median: number, min = median, max = median) => ({
  count: 1,
  min,
  max,
  mean: median,
  median,
})

function country(code: string, headcount: number, medianUsd: number): CountryInsight {
  return {
    country_code: code,
    country_name: code,
    currency: 'USD',
    headcount,
    local: stats(medianUsd),
    usd: stats(medianUsd),
  }
}

describe('rangeGeometry', () => {
  it('positions a range as percentages of the shared track', () => {
    expect(rangeGeometry({ min: 0, max: 200 }, { min: 50, median: 100, max: 150 })).toEqual({
      left: 25,
      width: 50,
      median: 50,
    })
  })

  it('spans the full track for the widest range', () => {
    expect(rangeGeometry({ min: 10, max: 20 }, { min: 10, median: 12, max: 20 })).toMatchObject({
      left: 0,
      width: 100,
    })
  })

  it('centres everything when the track has no width', () => {
    expect(rangeGeometry({ min: 5, max: 5 }, { min: 5, median: 5, max: 5 })).toEqual({
      left: 50,
      width: 0,
      median: 50,
    })
  })
})

describe('bucketLabel', () => {
  it('uses compact money for both ends', () => {
    expect(bucketLabel(80_000, 100_000, 'USD')).toBe('$80K–$100K')
  })
})

describe('countriesByMedianUsd', () => {
  it('ranks by USD median, highest first', () => {
    const ranked = countriesByMedianUsd([country('IN', 5, 30_000), country('US', 3, 100_000)])

    expect(ranked.map((r) => r.country)).toEqual(['US', 'IN'])
  })
})

describe('largestCountry', () => {
  it('picks the country with the most employees', () => {
    expect(largestCountry([country('US', 3, 1), country('IN', 5, 1)])).toBe('IN')
  })

  it('is undefined when there are no countries', () => {
    expect(largestCountry([])).toBeUndefined()
  })
})
