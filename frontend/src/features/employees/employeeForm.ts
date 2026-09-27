import { ApiError } from '../../api/client'
import type { Employee, EmployeeInput } from '../../api/types'

export interface EmployeeFormValues {
  full_name: string
  email: string
  job_title: string
  department: string
  country_code: string
  salary: number | string // Mantine NumberInput yields '' when cleared
  hire_date: string | null
}

export const emptyEmployeeForm: EmployeeFormValues = {
  full_name: '',
  email: '',
  job_title: '',
  department: '',
  country_code: '',
  salary: '',
  hire_date: null,
}

export function formValuesFromEmployee(employee: Employee): EmployeeFormValues {
  return {
    full_name: employee.full_name,
    email: employee.email,
    job_title: employee.job_title,
    department: employee.department,
    country_code: employee.country_code,
    salary: employee.salary,
    hire_date: employee.hire_date,
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const required = (label: string) => (value: string | null) =>
  value && value.trim() ? null : `${label} is required`

/** Client-side checks mirror the API's rules for fast feedback; the API stays the authority. */
export const employeeFormValidators = {
  full_name: required('Name'),
  email: (value: string) =>
    !value.trim()
      ? 'Email is required'
      : EMAIL_PATTERN.test(value.trim())
        ? null
        : 'Enter a valid email',
  job_title: required('Job title'),
  department: required('Department'),
  country_code: required('Country'),
  salary: (value: number | string) =>
    typeof value !== 'number' || Number.isNaN(value)
      ? 'Salary is required'
      : !Number.isInteger(value) || value <= 0
        ? 'Salary must be a positive whole number'
        : null,
  hire_date: (value: string | null) => {
    if (!value) return 'Hire date is required'
    return value > todayIso() ? 'Hire date cannot be in the future' : null
  },
}

export function toEmployeeInput(values: EmployeeFormValues): EmployeeInput {
  return {
    full_name: values.full_name.trim(),
    email: values.email.trim().toLowerCase(),
    job_title: values.job_title.trim(),
    department: values.department.trim(),
    country_code: values.country_code,
    salary: Number(values.salary),
    hire_date: values.hire_date ?? '',
  }
}

/** Only the fields that actually changed, so a PATCH never overwrites concurrent edits to others. */
export function changedFields(original: Employee, input: EmployeeInput): Partial<EmployeeInput> {
  const changes: Partial<EmployeeInput> = {}
  for (const key of Object.keys(input) as (keyof EmployeeInput)[]) {
    if (input[key] !== original[key]) (changes as Record<string, unknown>)[key] = input[key]
  }
  return changes
}

/** Map API errors onto form fields so the user sees them next to the input that caused them. */
export function apiErrorToFieldErrors(error: unknown): Record<string, string> | null {
  if (!(error instanceof ApiError)) return null
  if (error.status === 409) return { email: 'Another employee already uses this email' }
  if (error.status === 422 && error.detail === 'Unknown country code') {
    return { country_code: 'Unknown country' }
  }
  if (error.status === 422 && Array.isArray(error.detail)) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of error.detail) {
      const field = issue.loc[issue.loc.length - 1]
      if (typeof field === 'string') fieldErrors[field] = issue.msg.replace(/^Value error, /, '')
    }
    return Object.keys(fieldErrors).length ? fieldErrors : null
  }
  return null
}

export function todayIso(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}
