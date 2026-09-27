import { applyQueryChange, parseEmployeeQuery, toSearchParams } from './employeeQuery'

const parse = (query: string) => parseEmployeeQuery(new URLSearchParams(query))

describe('parseEmployeeQuery', () => {
  it('uses sensible defaults for an empty URL', () => {
    expect(parse('')).toEqual({
      search: undefined,
      country: undefined,
      department: undefined,
      job_title: undefined,
      sort: 'full_name',
      order: 'asc',
      page: 1,
      page_size: 25,
    })
  })

  it('reads filters, sorting and paging from the URL', () => {
    expect(parse('country=IN&sort=salary_usd&order=desc&page=3&page_size=50')).toMatchObject({
      country: 'IN',
      sort: 'salary_usd',
      order: 'desc',
      page: 3,
      page_size: 50,
    })
  })

  it.each([
    ['sort=; DROP TABLE', { sort: 'full_name' }],
    ['order=sideways', { order: 'asc' }],
    ['page=-2', { page: 1 }],
    ['page=abc', { page: 1 }],
    ['page_size=5000', { page_size: 25 }],
  ])('falls back to defaults for invalid input %s', (query, expected) => {
    expect(parse(query)).toMatchObject(expected)
  })
})

describe('applyQueryChange', () => {
  const onPage4 = { ...parse(''), page: 4 }

  it('returns to page 1 when filters change', () => {
    expect(applyQueryChange(onPage4, { country: 'IN' })).toMatchObject({ country: 'IN', page: 1 })
  })

  it('returns to page 1 when sorting changes', () => {
    expect(applyQueryChange(onPage4, { sort: 'hire_date' }).page).toBe(1)
  })

  it('keeps the requested page when paging', () => {
    expect(applyQueryChange(onPage4, { page: 5 }).page).toBe(5)
  })
})

describe('toSearchParams', () => {
  it('omits unset filters', () => {
    expect(toSearchParams({ ...parse(''), search: '' }).toString()).toBe(
      'sort=full_name&order=asc&page=1&page_size=25',
    )
  })
})
