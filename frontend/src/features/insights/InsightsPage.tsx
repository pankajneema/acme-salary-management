import { Alert, Grid, Group, Paper, Select, Skeleton, Stack, Text, Title } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import { useSearchParams } from 'react-router'

import {
  useCountryInsights,
  useDistribution,
  useJobTitleInsights,
  useMeta,
  useSummary,
} from '../../api/hooks'
import { DepartmentPayrollList, DistributionChart, MedianByCountryChart } from './charts'
import { largestCountry } from './insightsMath'
import { KpiRow } from './KpiRow'
import { CountryTable, JobTitleTable } from './tables'

export function InsightsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const summary = useSummary()
  const countries = useCountryInsights()
  const { data: meta } = useMeta()

  // The deep-dive country lives in the URL (?country=IN) so the view can be shared.
  const focusCountry = searchParams.get('country') ?? largestCountry(countries.data ?? [])
  const selectCountry = (code: string) => setSearchParams({ country: code }, { replace: true })

  const orgDistribution = useDistribution()
  const countryDistribution = useDistribution(focusCountry)
  const jobTitles = useJobTitleInsights(focusCountry)
  const focusName = meta?.countries.find((c) => c.code === focusCountry)?.name ?? focusCountry

  const error = summary.error ?? countries.error
  if (error) {
    return (
      <Alert color="red" icon={<IconAlertCircle />} title="Could not load insights">
        {error.message}
      </Alert>
    )
  }

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Insights</Title>
        <Text c="dimmed" size="sm">
          How ACME pays people. Cross-country figures are converted to USD at a fixed rate snapshot
          {meta ? ` (${meta.fx_snapshot_date})` : ''}; country figures are in local currency.
        </Text>
      </div>

      <KpiRow summary={summary.data} />

      <Grid gap="lg">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Panel title="Median salary by country" subtitle="USD, highest first">
            {countries.data ? (
              <MedianByCountryChart countries={countries.data} />
            ) : (
              <Skeleton h={340} />
            )}
          </Panel>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Panel title="Salary distribution" subtitle="All employees, USD">
            {orgDistribution.data ? (
              <DistributionChart distribution={orgDistribution.data} />
            ) : (
              <Skeleton h={280} />
            )}
          </Panel>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Panel
            title="Pay by country"
            subtitle="Local currency · select a row to explore it below"
          >
            {countries.data ? (
              <CountryTable
                countries={countries.data}
                selected={focusCountry}
                onSelect={selectCountry}
              />
            ) : (
              <Skeleton h={380} />
            )}
          </Panel>
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Panel title="Payroll by department" subtitle="Annual base salary, USD">
            {summary.data ? (
              <DepartmentPayrollList departments={summary.data.departments} />
            ) : (
              <Skeleton h={380} />
            )}
          </Panel>
        </Grid.Col>
      </Grid>

      <Paper withBorder radius="md" p="md">
        <Group justify="space-between" align="flex-end" mb="md">
          <div>
            <Title order={3}>Country deep dive</Title>
            <Text c="dimmed" size="sm">
              What each role earns in {focusName ?? 'a country'}, in local currency.
            </Text>
          </div>
          <Select
            aria-label="Country"
            data={(meta?.countries ?? []).map((c) => ({ value: c.code, label: c.name }))}
            value={focusCountry ?? null}
            onChange={(code) => code && selectCountry(code)}
            allowDeselect={false}
            searchable
            w={220}
          />
        </Group>
        <Grid gap="lg">
          <Grid.Col span={{ base: 12, lg: 7 }}>
            <Text fw={600} size="sm" mb="xs">
              Pay by job title
            </Text>
            {jobTitles.data ? <JobTitleTable data={jobTitles.data} /> : <Skeleton h={400} />}
          </Grid.Col>
          <Grid.Col span={{ base: 12, lg: 5 }}>
            <Text fw={600} size="sm" mb="xs">
              Salary distribution in {focusName}
            </Text>
            {countryDistribution.data ? (
              <DistributionChart distribution={countryDistribution.data} />
            ) : (
              <Skeleton h={280} />
            )}
          </Grid.Col>
        </Grid>
      </Paper>
    </Stack>
  )
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <Paper withBorder radius="md" p="md" h="100%">
      <Title order={4}>{title}</Title>
      <Text c="dimmed" size="xs" mb="md">
        {subtitle}
      </Text>
      {children}
    </Paper>
  )
}
