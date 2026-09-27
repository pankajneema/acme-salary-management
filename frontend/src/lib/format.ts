/** Money in its own currency, no decimals: "₹25,00,000" for INR, "$120,000" for USD. */
export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat(localeFor(currency), {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Short form for dense places like chart axes: "$1.2M", "$85K". */
export function formatCompactMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

export function formatDate(isoDate: string): string {
  // Parse as a calendar date, not a UTC instant, so it never shifts a day in local time.
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// INR reads naturally in lakh grouping (25,00,000); everything else uses en-US grouping.
function localeFor(currency: string): string {
  return currency === 'INR' ? 'en-IN' : 'en-US'
}
