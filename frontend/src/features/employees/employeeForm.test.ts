import { ApiError } from '../../api/client'
import { employee } from '../../test/fixtures'
import {
  apiErrorToFieldErrors,
  changedFields,
  employeeFormValidators as validate,
  formValuesFromEmployee,
  toEmployeeInput,
  todayIso,
} from './employeeForm'

describe('employeeFormValidators', () => {
  it.each([
    ['', 'Salary is required'],
    [0, 'Salary must be a positive whole number'],
    [-100, 'Salary must be a positive whole number'],
    [1000.5, 'Salary must be a positive whole number'],
    [85000, null],
  ])('salary %s -> %s', (value, expected) => {
    expect(validate.salary(value)).toBe(expected)
  })

  it.each([
    ['', 'Email is required'],
    ['nope', 'Enter a valid email'],
    ['a@acme.com', null],
  ])('email %s -> %s', (value, expected) => {
    expect(validate.email(value)).toBe(expected)
  })

  it('requires non-blank text fields', () => {
    expect(validate.full_name('   ')).toBe('Name is required')
    expect(validate.full_name('Asha')).toBeNull()
  })

  it('rejects a future hire date but accepts today', () => {
    expect(validate.hire_date('2999-01-01')).toBe('Hire date cannot be in the future')
    expect(validate.hire_date(todayIso())).toBeNull()
    expect(validate.hire_date(null)).toBe('Hire date is required')
  })
})

describe('toEmployeeInput', () => {
  it('trims text and lowercases email', () => {
    const input = toEmployeeInput({
      ...formValuesFromEmployee(employee()),
      full_name: '  Asha Rao ',
      email: ' Asha@ACME.com ',
    })

    expect(input.full_name).toBe('Asha Rao')
    expect(input.email).toBe('asha@acme.com')
  })
})

describe('changedFields', () => {
  it('returns only fields that differ from the original', () => {
    const original = employee()
    const input = toEmployeeInput({ ...formValuesFromEmployee(original), salary: 160000 })

    expect(changedFields(original, input)).toEqual({ salary: 160000 })
  })

  it('returns nothing when nothing changed', () => {
    const original = employee()

    expect(changedFields(original, toEmployeeInput(formValuesFromEmployee(original)))).toEqual({})
  })
})

describe('apiErrorToFieldErrors', () => {
  it('maps a duplicate email conflict to the email field', () => {
    expect(apiErrorToFieldErrors(new ApiError(409, 'duplicate'))).toEqual({
      email: 'Another employee already uses this email',
    })
  })

  it('maps FastAPI validation errors to their fields', () => {
    const error = new ApiError(422, [
      { loc: ['body', 'hire_date'], msg: 'Value error, hire_date cannot be in the future' },
    ])

    expect(apiErrorToFieldErrors(error)).toEqual({
      hire_date: 'hire_date cannot be in the future',
    })
  })

  it('returns null for errors that are not about a field', () => {
    expect(apiErrorToFieldErrors(new ApiError(500, 'boom'))).toBeNull()
    expect(apiErrorToFieldErrors(new Error('network'))).toBeNull()
  })
})
