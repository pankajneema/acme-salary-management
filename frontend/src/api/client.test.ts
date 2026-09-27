import { api, ApiError, toQueryString } from './client'

describe('toQueryString', () => {
  it('drops empty values', () => {
    expect(toQueryString({ search: '', country: 'IN', page: 2, sort: undefined, x: null })).toBe(
      '?country=IN&page=2',
    )
  })

  it('returns an empty string when nothing is set', () => {
    expect(toQueryString({ search: '' })).toBe('')
  })
})

describe('api', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('builds the export URL from filters only, without paging', () => {
    const url = api.exportEmployeesUrl({
      country: 'IN',
      page: 3,
      page_size: 50,
      sort: 'salary_usd',
    })

    expect(url).toBe('/api/employees/export.csv?country=IN&sort=salary_usd')
  })

  it('throws ApiError carrying the status and FastAPI detail', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () => new Response(JSON.stringify({ detail: 'Employee not found' }), { status: 404 }),
      ),
    )

    const error = await api.deleteEmployee(99).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 404, message: 'Employee not found' })
  })

  it('resolves 204 responses without parsing a body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 204 })),
    )

    await expect(api.deleteEmployee(1)).resolves.toBeUndefined()
  })
})
