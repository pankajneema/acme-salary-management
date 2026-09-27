import {
  Autocomplete,
  Button,
  Drawer,
  Group,
  NumberInput,
  Select,
  Stack,
  TextInput,
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useCreateEmployee, useUpdateEmployee } from '../../api/hooks'
import type { Employee, Meta } from '../../api/types'
import { formatMoney } from '../../lib/format'
import {
  apiErrorToFieldErrors,
  changedFields,
  emptyEmployeeForm,
  employeeFormValidators,
  formValuesFromEmployee,
  toEmployeeInput,
  todayIso,
  type EmployeeFormValues,
} from './employeeForm'

interface Props {
  opened: boolean
  /** The employee being edited, or null to create a new one. */
  employee: Employee | null
  meta: Meta | undefined
  onClose: () => void
}

export function EmployeeFormDrawer({ opened, employee, meta, onClose }: Props) {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="md"
      title={employee ? `Edit ${employee.full_name}` : 'Add employee'}
    >
      {/* Drawer unmounts its content when closed, so every open starts with fresh values. */}
      <EmployeeForm employee={employee} meta={meta} onDone={onClose} />
    </Drawer>
  )
}

interface FormProps {
  employee: Employee | null
  meta: Meta | undefined
  onDone: () => void
}

function EmployeeForm({ employee, meta, onDone }: FormProps) {
  const createEmployee = useCreateEmployee()
  const updateEmployee = useUpdateEmployee()
  const form = useForm<EmployeeFormValues>({
    initialValues: employee ? formValuesFromEmployee(employee) : emptyEmployeeForm,
    validate: employeeFormValidators,
  })

  const country = meta?.countries.find((c) => c.code === form.values.country_code)
  const salary = typeof form.values.salary === 'number' ? form.values.salary : null
  const departments = Array.from(new Set([...(meta?.departments ?? []), form.values.department]))
    .filter(Boolean)
    .sort()
  const saving = createEmployee.isPending || updateEmployee.isPending

  const handleSubmit = async (values: EmployeeFormValues) => {
    const input = toEmployeeInput(values)
    try {
      if (employee) {
        const changes = changedFields(employee, input)
        if (Object.keys(changes).length > 0) {
          await updateEmployee.mutateAsync({ id: employee.id, changes })
        }
        notifications.show({ color: 'teal', message: `${input.full_name} updated` })
      } else {
        const created = await createEmployee.mutateAsync(input)
        notifications.show({
          color: 'teal',
          message: `${created.full_name} added as ${created.employee_code}`,
        })
      }
      onDone()
    } catch (error) {
      const fieldErrors = apiErrorToFieldErrors(error)
      if (fieldErrors) {
        form.setErrors(fieldErrors)
      } else {
        notifications.show({
          color: 'red',
          title: 'Could not save employee',
          message: error instanceof Error ? error.message : 'Please try again.',
        })
      }
    }
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
      <Stack gap="md">
        <TextInput label="Full name" withAsterisk {...form.getInputProps('full_name')} />
        <TextInput label="Work email" type="email" withAsterisk {...form.getInputProps('email')} />
        <Select
          label="Country"
          withAsterisk
          searchable
          data={(meta?.countries ?? []).map((c) => ({
            value: c.code,
            label: `${c.name} (${c.currency})`,
          }))}
          {...form.getInputProps('country_code')}
        />
        <Autocomplete
          label="Job title"
          withAsterisk
          data={Object.keys(meta?.job_titles ?? {}).sort()}
          {...form.getInputProps('job_title')}
          onChange={(title) => {
            form.setFieldValue('job_title', title)
            // Known titles imply their department; custom titles leave it to the user.
            const department = meta?.job_titles[title]
            if (department) form.setFieldValue('department', department)
          }}
        />
        <Select
          label="Department"
          withAsterisk
          data={departments}
          {...form.getInputProps('department')}
        />
        <NumberInput
          label="Annual gross salary"
          withAsterisk
          thousandSeparator=","
          allowDecimal={false}
          allowNegative={false}
          min={1}
          leftSection={country?.currency ?? ''}
          leftSectionWidth={country ? 52 : undefined}
          description={
            country && salary && country.currency !== 'USD'
              ? `≈ ${formatMoney(Math.round(salary * country.usd_rate), 'USD')} per year`
              : 'In the currency of the selected country'
          }
          {...form.getInputProps('salary')}
        />
        <DateInput
          label="Hire date"
          withAsterisk
          valueFormat="D MMM YYYY"
          maxDate={todayIso()}
          {...form.getInputProps('hire_date')}
        />
        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={onDone} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {employee ? 'Save changes' : 'Add employee'}
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
