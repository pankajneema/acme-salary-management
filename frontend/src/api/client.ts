import type {
  CountryInsight,
  CountryJobTitles,
  Distribution,
  Employee,
  EmployeeInput,
  EmployeeQuery,
  Meta,
  Page,
  Summary,
} from './types'

/** FastAPI validation errors: [{ loc: ['body', 'email'], msg: '...' }] */
export interface ValidationIssue {
  loc: (string | number)[]
  msg: string
}

export class ApiError extends Error {
  readonly status: number
  readonly detail: string | ValidationIssue[] | undefined

  constructor(status: number, detail: string | ValidationIssue[] | undefined) {
    super(typeof detail === 'string' ? detail : `Request failed (${status})`)
    this.status = status
    this.detail = detail
  }
}

type Params = Record<string, string | number | undefined | null>

/** Drops empty values so the URL only carries filters that are actually set. */
export function toQueryString(params: Params): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => undefined)
    throw new ApiError(response.status, body?.detail)
  }
  return (response.status === 204 ? undefined : await response.json()) as T
}

const employeeFilters = (q: EmployeeQuery): Params => ({
  search: q.search,
  country: q.country,
  department: q.department,
  job_title: q.job_title,
  sort: q.sort,
  order: q.order,
})

export const api = {
  meta: () => request<Meta>('/meta'),

  listEmployees: (q: EmployeeQuery) =>
    request<Page<Employee>>(
      `/employees${toQueryString({ ...employeeFilters(q), page: q.page, page_size: q.page_size })}`,
    ),
  exportEmployeesUrl: (q: EmployeeQuery) =>
    `/api/employees/export.csv${toQueryString(employeeFilters(q))}`,
  createEmployee: (input: EmployeeInput) =>
    request<Employee>('/employees', { method: 'POST', body: JSON.stringify(input) }),
  updateEmployee: (id: number, input: Partial<EmployeeInput>) =>
    request<Employee>(`/employees/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  deleteEmployee: (id: number) => request<void>(`/employees/${id}`, { method: 'DELETE' }),

  summary: () => request<Summary>('/insights/summary'),
  countryInsights: () => request<CountryInsight[]>('/insights/countries'),
  jobTitleInsights: (countryCode: string) =>
    request<CountryJobTitles>(`/insights/countries/${countryCode}/job-titles`),
  distribution: (countryCode?: string) =>
    request<Distribution>(`/insights/distribution${toQueryString({ country: countryCode })}`),
}
