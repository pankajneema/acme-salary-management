// Mirrors backend/app/schemas.py. Keep in sync with the API contract.

export interface Country {
  code: string
  name: string
  currency: string
  usd_rate: number
}

export interface Meta {
  countries: Country[]
  departments: string[]
  job_titles: Record<string, string>
  fx_snapshot_date: string
}

export interface Employee {
  id: number
  employee_code: string
  full_name: string
  email: string
  job_title: string
  department: string
  country_code: string
  country_name: string
  currency: string
  salary: number
  salary_usd: number
  hire_date: string
  created_at: string
  updated_at: string
}

export interface EmployeeInput {
  full_name: string
  email: string
  job_title: string
  department: string
  country_code: string
  salary: number
  hire_date: string
}

export interface Page<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export type SortField =
  | 'full_name'
  | 'employee_code'
  | 'job_title'
  | 'department'
  | 'country'
  | 'salary_usd'
  | 'hire_date'

export type SortOrder = 'asc' | 'desc'

export interface EmployeeQuery {
  search?: string
  country?: string
  department?: string
  job_title?: string
  sort?: SortField
  order?: SortOrder
  page?: number
  page_size?: number
}

export interface SalaryStats {
  count: number
  min: number
  max: number
  mean: number
  median: number
}

export interface CountryInsight {
  country_code: string
  country_name: string
  currency: string
  headcount: number
  local: SalaryStats
  usd: SalaryStats
}

export interface JobTitleInsight {
  job_title: string
  department: string
  headcount: number
  local: SalaryStats
  usd: SalaryStats
}

export interface CountryJobTitles {
  country_code: string
  country_name: string
  currency: string
  job_titles: JobTitleInsight[]
}

export interface DepartmentInsight {
  department: string
  headcount: number
  total_payroll_usd: number
  median_salary_usd: number
}

export interface Summary {
  headcount: number
  country_count: number
  total_payroll_usd: number
  salary_usd: SalaryStats | null
  departments: DepartmentInsight[]
}

export interface Distribution {
  currency: string
  bucket_size: number
  buckets: { start: number; end: number; count: number }[]
}
