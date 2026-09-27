import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client'
import type { EmployeeInput, EmployeeQuery } from './types'

export const queryKeys = {
  meta: ['meta'] as const,
  employees: (q: EmployeeQuery) => ['employees', q] as const,
  insights: ['insights'] as const,
}

export function useMeta() {
  // Reference data changes only on deploy.
  return useQuery({ queryKey: queryKeys.meta, queryFn: api.meta, staleTime: Infinity })
}

export function useEmployees(query: EmployeeQuery) {
  return useQuery({
    queryKey: queryKeys.employees(query),
    queryFn: () => api.listEmployees(query),
    // Keep the current page on screen while the next one loads: no flicker when paging.
    placeholderData: keepPreviousData,
  })
}

/** Any write can change both the directory and every insight, so refresh both. */
function useInvalidateEmployeeData() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['employees'] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.insights }),
    ])
}

export function useCreateEmployee() {
  const invalidate = useInvalidateEmployeeData()
  return useMutation({
    mutationFn: (input: EmployeeInput) => api.createEmployee(input),
    onSuccess: invalidate,
  })
}

export function useUpdateEmployee() {
  const invalidate = useInvalidateEmployeeData()
  return useMutation({
    mutationFn: ({ id, changes }: { id: number; changes: Partial<EmployeeInput> }) =>
      api.updateEmployee(id, changes),
    onSuccess: invalidate,
  })
}

export function useDeleteEmployee() {
  const invalidate = useInvalidateEmployeeData()
  return useMutation({
    mutationFn: (id: number) => api.deleteEmployee(id),
    onSuccess: invalidate,
  })
}
