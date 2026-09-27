import { useSearchParams } from 'react-router'

import type { EmployeeQuery, SortField, SortOrder } from '../../api/types'

export const PAGE_SIZES = [10, 25, 50, 100] as const
const DEFAULT_PAGE_SIZE = 25

const SORT_FIELDS: readonly SortField[] = [
  'full_name',
  'employee_code',
  'job_title',
  'department',
  'country',
  'salary_usd',
  'hire_date',
]

export type ResolvedEmployeeQuery = Required<
  Pick<EmployeeQuery, 'sort' | 'order' | 'page' | 'page_size'>
> &
  Pick<EmployeeQuery, 'search' | 'country' | 'department' | 'job_title'>

/** URL -> query. Anything invalid falls back to a default instead of breaking the page. */
export function parseEmployeeQuery(params: URLSearchParams): ResolvedEmployeeQuery {
  const sort = params.get('sort') as SortField | null
  const order = params.get('order') as SortOrder | null
  const page = Number(params.get('page'))
  const pageSize = Number(params.get('page_size'))

  return {
    search: params.get('search') || undefined,
    country: params.get('country') || undefined,
    department: params.get('department') || undefined,
    job_title: params.get('job_title') || undefined,
    sort: sort && SORT_FIELDS.includes(sort) ? sort : 'full_name',
    order: order === 'desc' ? 'desc' : 'asc',
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    page_size: (PAGE_SIZES as readonly number[]).includes(pageSize) ? pageSize : DEFAULT_PAGE_SIZE,
  }
}

/** Apply a change. Changing what is shown (filters, sort, page size) returns to page 1. */
export function applyQueryChange(
  current: ResolvedEmployeeQuery,
  change: Partial<EmployeeQuery>,
): ResolvedEmployeeQuery {
  const next = { ...current, ...change }
  if (!('page' in change)) next.page = 1
  return next
}

export function toSearchParams(query: ResolvedEmployeeQuery): URLSearchParams {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  return params
}

/** List state lives in the URL: refresh-safe, back-button friendly and shareable. */
export function useEmployeeQuery() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = parseEmployeeQuery(searchParams)
  const update = (change: Partial<EmployeeQuery>) =>
    setSearchParams(toSearchParams(applyQueryChange(query, change)), { replace: true })
  return [query, update] as const
}
