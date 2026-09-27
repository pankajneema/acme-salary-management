import { Box, Table, Text, Tooltip } from '@mantine/core'

import type { CountryInsight, CountryJobTitles } from '../../api/types'
import { formatMoney, formatNumber } from '../../lib/format'
import { rangeGeometry } from './insightsMath'

const numeric = { fontVariantNumeric: 'tabular-nums' } as const

interface CountryTableProps {
  countries: CountryInsight[]
  selected: string | undefined
  onSelect: (countryCode: string) => void
}

/** Every country's pay in its own currency, plus a USD median for comparison across rows. */
export function CountryTable({ countries, selected, onSelect }: CountryTableProps) {
  return (
    <Table.ScrollContainer minWidth={720}>
      <Table highlightOnHover verticalSpacing="xs">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Country</Table.Th>
            <Table.Th ta="right">Headcount</Table.Th>
            <Table.Th ta="right">Min</Table.Th>
            <Table.Th ta="right">Median</Table.Th>
            <Table.Th ta="right">Mean</Table.Th>
            <Table.Th ta="right">Max</Table.Th>
            <Table.Th ta="right">Median (USD)</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {countries.map((c) => {
            const money = (value: number) => formatMoney(value, c.currency)
            const isSelected = c.country_code === selected
            return (
              <Table.Tr
                key={c.country_code}
                onClick={() => onSelect(c.country_code)}
                bg={isSelected ? 'var(--mantine-primary-color-light)' : undefined}
                style={{ cursor: 'pointer' }}
                aria-selected={isSelected}
              >
                <Table.Td>
                  <Text size="sm" fw={500}>
                    {c.country_name}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {c.currency}
                  </Text>
                </Table.Td>
                <Table.Td ta="right" style={numeric}>
                  {formatNumber(c.headcount)}
                </Table.Td>
                <Table.Td ta="right" style={numeric}>
                  {money(c.local.min)}
                </Table.Td>
                <Table.Td ta="right" style={numeric} fw={600}>
                  {money(c.local.median)}
                </Table.Td>
                <Table.Td ta="right" style={numeric}>
                  {money(c.local.mean)}
                </Table.Td>
                <Table.Td ta="right" style={numeric}>
                  {money(c.local.max)}
                </Table.Td>
                <Table.Td ta="right" style={numeric}>
                  {formatMoney(c.usd.median, 'USD')}
                </Table.Td>
              </Table.Tr>
            )
          })}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}

/** Job titles in one country: numbers for precision, a range bar for shape at a glance. */
export function JobTitleTable({ data }: { data: CountryJobTitles }) {
  if (data.job_titles.length === 0) {
    return (
      <Text c="dimmed" size="sm" py="xl" ta="center">
        No employees in {data.country_name} yet.
      </Text>
    )
  }

  const money = (value: number) => formatMoney(value, data.currency)
  const track = {
    min: Math.min(...data.job_titles.map((j) => j.local.min)),
    max: Math.max(...data.job_titles.map((j) => j.local.max)),
  }

  return (
    <Table.ScrollContainer minWidth={760}>
      <Table verticalSpacing="xs" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Job title</Table.Th>
            <Table.Th ta="right">People</Table.Th>
            <Table.Th ta="right">Min</Table.Th>
            <Table.Th ta="right">Median</Table.Th>
            <Table.Th ta="right">Max</Table.Th>
            <Table.Th w={200}>
              Range{' '}
              <Text span size="xs" c="dimmed" fw={400}>
                (● median)
              </Text>
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.job_titles.map((j) => (
            <Table.Tr key={j.job_title}>
              <Table.Td>
                <Text size="sm" fw={500}>
                  {j.job_title}
                </Text>
                <Text size="xs" c="dimmed">
                  {j.department}
                </Text>
              </Table.Td>
              <Table.Td ta="right" style={numeric}>
                {formatNumber(j.headcount)}
              </Table.Td>
              <Table.Td ta="right" style={numeric}>
                {money(j.local.min)}
              </Table.Td>
              <Table.Td ta="right" style={numeric} fw={600}>
                {money(j.local.median)}
              </Table.Td>
              <Table.Td ta="right" style={numeric}>
                {money(j.local.max)}
              </Table.Td>
              <Table.Td>
                <Tooltip
                  label={`${money(j.local.min)} – ${money(j.local.max)} · median ${money(j.local.median)}`}
                >
                  <div>
                    <RangeBar track={track} stats={j.local} />
                  </div>
                </Tooltip>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}

function RangeBar({
  track,
  stats,
}: {
  track: { min: number; max: number }
  stats: { min: number; median: number; max: number }
}) {
  const g = rangeGeometry(track, stats)
  return (
    // Inset by the dot radius so a median at either end is never clipped.
    <Box pos="relative" h={16} mx={6} aria-hidden>
      <Box
        pos="absolute"
        top={6}
        left={0}
        right={0}
        h={4}
        bg="var(--viz-track)"
        style={{ borderRadius: 2 }}
      />
      <Box
        pos="absolute"
        top={4}
        h={8}
        left={`${g.left}%`}
        w={`${g.width}%`}
        bg="var(--viz-range)"
        style={{ borderRadius: 4, minWidth: 4 }}
      />
      <Box
        pos="absolute"
        top={2}
        left={`calc(${g.median}% - 6px)`}
        w={12}
        h={12}
        bg="var(--viz-series)"
        style={{ borderRadius: '50%', boxShadow: '0 0 0 2px var(--mantine-color-body)' }}
      />
    </Box>
  )
}
