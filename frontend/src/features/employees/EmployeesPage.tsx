import {
  Alert,
  Badge,
  Button,
  Group,
  LoadingOverlay,
  Pagination,
  Paper,
  Select,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { IconAlertCircle, IconDownload, IconPlus } from '@tabler/icons-react'
import { useState } from 'react'

import { api } from '../../api/client'
import { useDeleteEmployee, useEmployees, useMeta } from '../../api/hooks'
import type { Employee } from '../../api/types'
import { formatMoney, formatNumber } from '../../lib/format'
import { EmployeeFilters } from './EmployeeFilters'
import { EmployeeFormDrawer } from './EmployeeFormDrawer'
import { EmployeeTable } from './EmployeeTable'
import { PAGE_SIZES, useEmployeeQuery } from './employeeQuery'

type DrawerState = { opened: false } | { opened: true; employee: Employee | null }

export function EmployeesPage() {
  const [query, updateQuery] = useEmployeeQuery()
  const { data: meta } = useMeta()
  const { data, isLoading, isFetching, isError, error } = useEmployees(query)
  const deleteEmployee = useDeleteEmployee()
  const [drawer, setDrawer] = useState<DrawerState>({ opened: false })

  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / query.page_size))
  const firstRow = total === 0 ? 0 : (query.page - 1) * query.page_size + 1
  const lastRow = Math.min(query.page * query.page_size, total)

  const confirmDelete = (employee: Employee) =>
    modals.openConfirmModal({
      title: `Delete ${employee.full_name}?`,
      children: (
        <Text size="sm">
          {employee.employee_code} · {employee.job_title}, {employee.country_name} ·{' '}
          {formatMoney(employee.salary, employee.currency)}. This cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Delete employee', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () =>
        deleteEmployee.mutate(employee.id, {
          onSuccess: () => notifications.show({ message: `${employee.full_name} deleted` }),
          onError: (err) =>
            notifications.show({ color: 'red', title: 'Delete failed', message: err.message }),
        }),
    })

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <div>
          <Group gap="xs" align="center">
            <Title order={2}>Employees</Title>
            {data && (
              <Badge variant="light" size="lg">
                {formatNumber(total)}
              </Badge>
            )}
          </Group>
          <Text c="dimmed" size="sm">
            Search, filter and update salary records. Salaries are annual gross in local currency.
          </Text>
        </div>
        <Group gap="sm">
          <Button
            component="a"
            href={api.exportEmployeesUrl(query)}
            download
            variant="default"
            leftSection={<IconDownload size={16} />}
          >
            Export CSV
          </Button>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setDrawer({ opened: true, employee: null })}
          >
            Add employee
          </Button>
        </Group>
      </Group>

      <Paper withBorder p="md" radius="md">
        <EmployeeFilters query={query} meta={meta} onChange={updateQuery} />
      </Paper>

      {isError && (
        <Alert color="red" icon={<IconAlertCircle />} title="Could not load employees">
          {error.message}
        </Alert>
      )}

      <Paper withBorder radius="md" pos="relative">
        <LoadingOverlay
          visible={isLoading || isFetching}
          overlayProps={{ blur: 1, opacity: 0.4 }}
        />
        <EmployeeTable
          employees={data?.items ?? []}
          sort={query.sort}
          order={query.order}
          onSort={(sort, order) => updateQuery({ sort, order })}
          onEdit={(employee) => setDrawer({ opened: true, employee })}
          onDelete={confirmDelete}
        />
      </Paper>

      <Group justify="space-between">
        <Group gap="sm">
          <Text size="sm" c="dimmed">
            {total === 0
              ? 'No results'
              : `Showing ${formatNumber(firstRow)}–${formatNumber(lastRow)} of ${formatNumber(total)}`}
          </Text>
          <Select
            aria-label="Rows per page"
            size="xs"
            w={110}
            data={PAGE_SIZES.map((n) => ({ value: String(n), label: `${n} / page` }))}
            value={String(query.page_size)}
            onChange={(value) => value && updateQuery({ page_size: Number(value) })}
            allowDeselect={false}
          />
        </Group>
        <Pagination
          total={pageCount}
          value={query.page}
          onChange={(page) => updateQuery({ page })}
          siblings={1}
        />
      </Group>

      <EmployeeFormDrawer
        opened={drawer.opened}
        employee={drawer.opened ? drawer.employee : null}
        meta={meta}
        onClose={() => setDrawer({ opened: false })}
      />
    </Stack>
  )
}
