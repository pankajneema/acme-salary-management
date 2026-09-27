import {
  ActionIcon,
  Center,
  Group,
  Stack,
  Table,
  Text,
  Tooltip,
  UnstyledButton,
} from '@mantine/core'
import {
  IconArrowsSort,
  IconPencil,
  IconSortAscending,
  IconSortDescending,
  IconTrash,
  IconUsers,
} from '@tabler/icons-react'
import type { ReactNode } from 'react'

import type { Employee, SortField, SortOrder } from '../../api/types'
import { formatDate, formatMoney } from '../../lib/format'

interface Props {
  employees: Employee[]
  sort: SortField
  order: SortOrder
  onSort: (sort: SortField, order: SortOrder) => void
  onEdit: (employee: Employee) => void
  onDelete: (employee: Employee) => void
}

export function EmployeeTable({ employees, sort, order, onSort, onEdit, onDelete }: Props) {
  const header = (field: SortField, label: ReactNode, align: 'left' | 'right' = 'left') => (
    <SortableTh
      active={sort === field}
      order={order}
      align={align}
      onClick={() => onSort(field, sort === field && order === 'asc' ? 'desc' : 'asc')}
    >
      {label}
    </SortableTh>
  )

  return (
    <Table.ScrollContainer minWidth={900}>
      <Table highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            {header('employee_code', 'Code')}
            {header('full_name', 'Employee')}
            {header('job_title', 'Role')}
            {header('country', 'Country')}
            {header('salary_usd', 'Annual salary', 'right')}
            {header('hire_date', 'Hired')}
            <Table.Th aria-label="Actions" />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {employees.map((employee) => (
            <Table.Tr key={employee.id}>
              <Table.Td>
                <Text size="sm" ff="monospace" c="dimmed">
                  {employee.employee_code}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm" fw={500}>
                  {employee.full_name}
                </Text>
                <Text size="xs" c="dimmed">
                  {employee.email}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{employee.job_title}</Text>
                <Text size="xs" c="dimmed">
                  {employee.department}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{employee.country_name}</Text>
              </Table.Td>
              <Table.Td ta="right">
                <Text size="sm" fw={500} style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatMoney(employee.salary, employee.currency)}
                </Text>
                {employee.currency !== 'USD' && (
                  <Text size="xs" c="dimmed" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    ≈ {formatMoney(employee.salary_usd, 'USD')}
                  </Text>
                )}
              </Table.Td>
              <Table.Td>
                <Text size="sm">{formatDate(employee.hire_date)}</Text>
              </Table.Td>
              <Table.Td>
                <Group gap={4} justify="flex-end" wrap="nowrap">
                  <Tooltip label="Edit">
                    <ActionIcon
                      variant="subtle"
                      aria-label={`Edit ${employee.full_name}`}
                      onClick={() => onEdit(employee)}
                    >
                      <IconPencil size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Delete">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      aria-label={`Delete ${employee.full_name}`}
                      onClick={() => onDelete(employee)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
          {employees.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={7}>
                <Center py="xl">
                  <Stack align="center" gap={4}>
                    <IconUsers size={32} stroke={1.5} color="var(--mantine-color-dimmed)" />
                    <Text fw={500}>No employees match these filters</Text>
                    <Text size="sm" c="dimmed">
                      Try a different search or clear the filters.
                    </Text>
                  </Stack>
                </Center>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}

interface SortableThProps {
  active: boolean
  order: SortOrder
  align: 'left' | 'right'
  onClick: () => void
  children: ReactNode
}

function SortableTh({ active, order, align, onClick, children }: SortableThProps) {
  const Icon = !active ? IconArrowsSort : order === 'asc' ? IconSortAscending : IconSortDescending
  return (
    <Table.Th aria-sort={active ? (order === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <UnstyledButton onClick={onClick} w="100%">
        <Group gap={4} justify={align === 'right' ? 'flex-end' : 'flex-start'} wrap="nowrap">
          <Text size="sm" fw={600}>
            {children}
          </Text>
          <Icon size={14} stroke={1.5} opacity={active ? 1 : 0.4} />
        </Group>
      </UnstyledButton>
    </Table.Th>
  )
}
