import { BarChart } from '@mantine/charts'
import { Box, Group, Paper, Stack, Text, Tooltip } from '@mantine/core'
import type { ReactNode } from 'react'
import type { TooltipContentProps } from 'recharts'

import type { CountryInsight, DepartmentInsight, Distribution } from '../../api/types'
import { formatCompactMoney, formatMoney, formatNumber } from '../../lib/format'
import { bucketLabel, countriesByMedianUsd } from './insightsMath'

const SERIES = 'var(--viz-series)'
const AXIS_TICK = { fontSize: 12 }

/** One tooltip card for every chart: value in primary ink, context in dimmed ink. */
function TooltipCard({ title, lines }: { title: string; lines: ReactNode[] }) {
  return (
    <Paper withBorder shadow="md" p="xs" radius="md">
      <Text size="sm" fw={600}>
        {title}
      </Text>
      {lines.map((line, i) => (
        <Text key={i} size="xs" c={i === 0 ? undefined : 'dimmed'}>
          {line}
        </Text>
      ))}
    </Paper>
  )
}

/** The data row under the cursor (Recharts passes it as payload[0].payload). */
function hoveredRow<T>(props: TooltipContentProps<number, string>): T | undefined {
  return props.payload?.[0]?.payload as T | undefined
}

export function MedianByCountryChart({ countries }: { countries: CountryInsight[] }) {
  const data = countriesByMedianUsd(countries)
  return (
    <BarChart
      h={Math.max(data.length * 34, 160)}
      data={data}
      dataKey="country"
      orientation="vertical"
      series={[{ name: 'median', label: 'Median salary (USD)', color: SERIES }]}
      valueFormatter={(v) => formatCompactMoney(v, 'USD')}
      gridAxis="y"
      strokeDasharray="0"
      tickLine="none"
      maxBarWidth={18}
      barProps={{ radius: [0, 4, 4, 0] }}
      yAxisProps={{ width: 120, tick: AXIS_TICK }}
      xAxisProps={{ tick: AXIS_TICK }}
      tooltipAnimationDuration={0}
      tooltipProps={{
        content: (props: TooltipContentProps<number, string>) => {
          const row = hoveredRow<(typeof data)[number]>(props)
          return row ? (
            <TooltipCard
              title={row.country}
              lines={[
                `Median ${formatMoney(row.median, 'USD')}`,
                `Range ${formatMoney(row.min, 'USD')} – ${formatMoney(row.max, 'USD')}`,
                `${formatNumber(row.headcount)} employees`,
              ]}
            />
          ) : null
        },
      }}
    />
  )
}

export function DistributionChart({ distribution }: { distribution: Distribution }) {
  const { currency } = distribution
  const data = distribution.buckets.map((b) => ({
    label: formatCompactMoney(b.start, currency),
    range: bucketLabel(b.start, b.end, currency),
    count: b.count,
  }))
  if (data.length === 0) {
    return (
      <Text c="dimmed" size="sm" py="xl" ta="center">
        No salaries to show.
      </Text>
    )
  }
  return (
    <BarChart
      h={280}
      data={data}
      dataKey="label"
      series={[{ name: 'count', label: 'Employees', color: SERIES }]}
      gridAxis="x"
      strokeDasharray="0"
      tickLine="none"
      barProps={{ radius: [4, 4, 0, 0] }}
      barChartProps={{ barCategoryGap: 2 }}
      xAxisProps={{ tick: AXIS_TICK, interval: 'preserveStartEnd' }}
      yAxisProps={{ tick: AXIS_TICK, width: 44 }}
      valueFormatter={formatNumber}
      tooltipAnimationDuration={0}
      tooltipProps={{
        content: (props: TooltipContentProps<number, string>) => {
          const row = hoveredRow<(typeof data)[number]>(props)
          return row ? (
            <TooltipCard title={row.range} lines={[`${formatNumber(row.count)} employees`]} />
          ) : null
        },
      }}
    />
  )
}

/** Ranked bars with the name and value as text, so every number is readable without hover. */
export function DepartmentPayrollList({ departments }: { departments: DepartmentInsight[] }) {
  const largest = Math.max(...departments.map((d) => d.total_payroll_usd), 1)
  return (
    <Stack gap="sm">
      {departments.map((d) => (
        <Tooltip
          key={d.department}
          label={`${formatNumber(d.headcount)} employees · median ${formatMoney(d.median_salary_usd, 'USD')}`}
          position="top-start"
        >
          <div>
            <Group justify="space-between" gap="xs" wrap="nowrap">
              <Text size="sm">{d.department}</Text>
              <Text size="sm" fw={600} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatCompactMoney(d.total_payroll_usd, 'USD')}
              </Text>
            </Group>
            <Box h={8} mt={4} bg="var(--viz-track)" style={{ borderRadius: 4 }}>
              <Box
                h="100%"
                w={`${(d.total_payroll_usd / largest) * 100}%`}
                bg={SERIES}
                style={{ borderRadius: 4 }}
              />
            </Box>
          </div>
        </Tooltip>
      ))}
    </Stack>
  )
}
