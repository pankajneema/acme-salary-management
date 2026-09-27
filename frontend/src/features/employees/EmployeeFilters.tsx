import { Button, Group, Select, TextInput } from '@mantine/core'
import { useDebouncedCallback } from '@mantine/hooks'
import { IconSearch, IconX } from '@tabler/icons-react'
import { useState } from 'react'

import type { EmployeeQuery, Meta } from '../../api/types'

interface Props {
  query: EmployeeQuery
  meta: Meta | undefined
  onChange: (change: Partial<EmployeeQuery>) => void
}

export function EmployeeFilters({ query, meta, onChange }: Props) {
  // Local state keeps typing instant; the URL/API update is debounced.
  const [search, setSearch] = useState(query.search ?? '')
  const commitSearch = useDebouncedCallback((value: string) => onChange({ search: value }), 300)

  const hasFilters = Boolean(query.search || query.country || query.department || query.job_title)
  const jobTitles = Object.entries(meta?.job_titles ?? {})
    .filter(([, department]) => !query.department || department === query.department)
    .map(([title]) => title)
    .sort()

  return (
    <Group gap="sm" align="flex-end" wrap="wrap">
      <TextInput
        label="Search"
        placeholder="Name, email or employee code"
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(event) => {
          setSearch(event.currentTarget.value)
          commitSearch(event.currentTarget.value)
        }}
        w={{ base: '100%', sm: 280 }}
      />
      <Select
        label="Country"
        placeholder="All countries"
        data={(meta?.countries ?? []).map((c) => ({ value: c.code, label: c.name }))}
        value={query.country ?? null}
        onChange={(value) => onChange({ country: value ?? undefined })}
        clearable
        searchable
        w={{ base: '100%', sm: 180 }}
      />
      <Select
        label="Department"
        placeholder="All departments"
        data={meta?.departments ?? []}
        value={query.department ?? null}
        onChange={(value) => onChange({ department: value ?? undefined, job_title: undefined })}
        clearable
        w={{ base: '100%', sm: 180 }}
      />
      <Select
        label="Job title"
        placeholder="All job titles"
        data={jobTitles}
        value={query.job_title ?? null}
        onChange={(value) => onChange({ job_title: value ?? undefined })}
        clearable
        searchable
        w={{ base: '100%', sm: 220 }}
      />
      {hasFilters && (
        <Button
          variant="subtle"
          leftSection={<IconX size={16} />}
          onClick={() => {
            setSearch('')
            onChange({
              search: undefined,
              country: undefined,
              department: undefined,
              job_title: undefined,
            })
          }}
        >
          Clear filters
        </Button>
      )}
    </Group>
  )
}
