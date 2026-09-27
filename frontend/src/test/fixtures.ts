import type { Employee, Meta, Page } from '../api/types'

export const meta: Meta = {
  countries: [
    { code: 'IN', name: 'India', currency: 'INR', usd_rate: 0.012 },
    { code: 'US', name: 'United States', currency: 'USD', usd_rate: 1 },
  ],
  departments: ['Data', 'Engineering'],
  job_titles: { 'Data Analyst': 'Data', 'Software Engineer': 'Engineering' },
  fx_snapshot_date: '2026-01-01',
}

export function employee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: 1,
    employee_code: 'EMP-00001',
    full_name: 'Alice Smith',
    email: 'alice.smith@acme.com',
    job_title: 'Software Engineer',
    department: 'Engineering',
    country_code: 'US',
    country_name: 'United States',
    currency: 'USD',
    salary: 150000,
    salary_usd: 150000,
    hire_date: '2021-04-12',
    created_at: '2026-01-01T00:00:00',
    updated_at: '2026-01-01T00:00:00',
    ...overrides,
  }
}

export function page(items: Employee[], total = items.length): Page<Employee> {
  return { items, total, page: 1, page_size: 25 }
}
