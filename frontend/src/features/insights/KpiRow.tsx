import { Paper, SimpleGrid, Skeleton, Text } from '@mantine/core'

import type { Summary } from '../../api/types'
import { formatCompactMoney, formatMoney, formatNumber } from '../../lib/format'

interface Tile {
  label: string
  value: string
  hint: string
}

function tiles(summary: Summary): Tile[] {
  const stats = summary.salary_usd
  return [
    { label: 'Employees', value: formatNumber(summary.headcount), hint: 'Active records' },
    {
      label: 'Countries',
      value: formatNumber(summary.country_count),
      hint: 'With at least one employee',
    },
    {
      label: 'Annual payroll',
      value: formatCompactMoney(summary.total_payroll_usd, 'USD'),
      hint: 'Base salary, converted to USD',
    },
    {
      label: 'Median salary',
      value: stats ? formatMoney(stats.median, 'USD') : '—',
      hint: stats ? `Mean ${formatMoney(stats.mean, 'USD')}` : 'No employees yet',
    },
  ]
}

export function KpiRow({ summary }: { summary: Summary | undefined }) {
  return (
    <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }}>
      {summary
        ? tiles(summary).map((tile) => (
            <Paper key={tile.label} withBorder p="md" radius="md">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                {tile.label}
              </Text>
              <Text fz={28} fw={700} mt={4} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {tile.value}
              </Text>
              <Text size="xs" c="dimmed">
                {tile.hint}
              </Text>
            </Paper>
          ))
        : Array.from({ length: 4 }, (_, i) => <Skeleton key={i} h={98} radius="md" />)}
    </SimpleGrid>
  )
}
