import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { CountryInsight, CountryJobTitles, Summary } from '../../api/types'
import { meta } from '../../test/fixtures'
import { mockApi, renderPage, requestedUrls } from '../../test/render'
import { InsightsPage } from './InsightsPage'

const stats = (min: number, median: number, max: number, count = 1) => ({
  count,
  min,
  max,
  median,
  mean: Math.round(median * 1.1), // distinct from the median so each value appears once
})

const summary: Summary = {
  headcount: 3,
  country_count: 2,
  total_payroll_usd: 1_267_000,
  salary_usd: stats(30_000, 100_000, 150_000, 3),
  departments: [
    {
      department: 'Engineering',
      headcount: 2,
      total_payroll_usd: 250_000,
      median_salary_usd: 125_000,
    },
    { department: 'Data', headcount: 1, total_payroll_usd: 30_000, median_salary_usd: 30_000 },
  ],
}

const countries: CountryInsight[] = [
  {
    country_code: 'IN',
    country_name: 'India',
    currency: 'INR',
    headcount: 5,
    local: stats(1_000_000, 2_500_000, 4_000_000, 5),
    usd: stats(12_000, 30_000, 48_000, 5),
  },
  {
    country_code: 'US',
    country_name: 'United States',
    currency: 'USD',
    headcount: 2,
    local: stats(100_000, 125_000, 150_000, 2),
    usd: stats(100_000, 125_000, 150_000, 2),
  },
]

const jobTitles = (code: string): CountryJobTitles => ({
  country_code: code,
  country_name: code === 'IN' ? 'India' : 'United States',
  currency: code === 'IN' ? 'INR' : 'USD',
  job_titles: [
    {
      job_title: code === 'IN' ? 'Data Analyst' : 'Software Engineer',
      department: 'Data',
      headcount: 2,
      local: stats(1_000, 2_000, 3_000, 2),
      usd: stats(1_000, 2_000, 3_000, 2),
    },
  ],
})

function renderInsights(url = '/insights') {
  const fetchMock = mockApi({
    'GET /api/meta': () => meta,
    'GET /api/insights/summary': () => summary,
    'GET /api/insights/countries': () => countries,
    'GET /api/insights/distribution': (u) => ({
      currency: u.searchParams.get('country') === 'IN' ? 'INR' : 'USD',
      bucket_size: 10_000,
      buckets: [{ start: 0, end: 10_000, count: 3 }],
    }),
    'GET /api/insights/countries/IN/job-titles': () => jobTitles('IN'),
    'GET /api/insights/countries/US/job-titles': () => jobTitles('US'),
  })
  return { ...renderPage(<InsightsPage />, { path: '/insights', url }), fetchMock }
}

afterEach(() => vi.unstubAllGlobals())

describe('InsightsPage', () => {
  it('shows the headline numbers', async () => {
    renderInsights()

    expect(await screen.findByText('$1.3M')).toBeInTheDocument()
    const medianTile = screen.getByText('Median salary').parentElement!
    expect(within(medianTile).getByText('$100,000')).toBeInTheDocument()
    expect(within(medianTile).getByText('Mean $110,000')).toBeInTheDocument()
  })

  it('lists every country with local-currency stats and a USD median', async () => {
    renderInsights()

    const row = (await screen.findByRole('cell', { name: /India/ })).closest('tr')!
    expect(within(row).getByText('₹25,00,000')).toBeInTheDocument()
    expect(within(row).getByText('$30,000')).toBeInTheDocument()
  })

  it('deep-dives into the largest country by default', async () => {
    renderInsights()

    expect(await screen.findByText('Data Analyst')).toBeInTheDocument()
    expect(screen.getByText('Salary distribution in India')).toBeInTheDocument()
  })

  it('switches the deep dive when a country row is clicked and records it in the URL', async () => {
    const user = userEvent.setup()
    const { router, fetchMock } = renderInsights()

    await user.click(await screen.findByRole('cell', { name: /United States/ }))

    expect(await screen.findByText('Software Engineer')).toBeInTheDocument()
    await waitFor(() => expect(router.state.location.search).toBe('?country=US'))
    expect(
      requestedUrls(fetchMock, '/api/insights/distribution').at(-1)?.searchParams.get('country'),
    ).toBe('US')
  })

  it('shows department payroll as readable text, not only bars', async () => {
    renderInsights()

    expect(await screen.findByText('Engineering')).toBeInTheDocument()
    expect(screen.getByText('$250K')).toBeInTheDocument()
  })

  it('shows an error instead of an empty dashboard when the API fails', async () => {
    mockApi({})
    renderPage(<InsightsPage />, { path: '/insights', url: '/insights' })

    expect(await screen.findByText('Could not load insights')).toBeInTheDocument()
  })
})
