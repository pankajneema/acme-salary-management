import { formatCompactMoney, formatDate, formatMoney, formatNumber } from './format'

describe('formatMoney', () => {
  it('formats USD without decimals', () => {
    expect(formatMoney(120000, 'USD')).toBe('$120,000')
  })

  it('uses lakh grouping for INR', () => {
    expect(formatMoney(2500000, 'INR')).toBe('₹25,00,000')
  })

  it('shows the currency symbol for other currencies', () => {
    expect(formatMoney(80000, 'EUR')).toBe('€80,000')
  })
})

describe('formatCompactMoney', () => {
  it('abbreviates large amounts', () => {
    expect(formatCompactMoney(1_250_000, 'USD')).toBe('$1.3M')
    expect(formatCompactMoney(85_000, 'USD')).toBe('$85K')
  })
})

describe('formatNumber', () => {
  it('adds thousands separators', () => {
    expect(formatNumber(10000)).toBe('10,000')
  })
})

describe('formatDate', () => {
  it('formats a calendar date without shifting it across time zones', () => {
    expect(formatDate('2021-01-01')).toBe('Jan 1, 2021')
  })
})
