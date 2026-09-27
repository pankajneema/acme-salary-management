import { createBrowserRouter, Navigate } from 'react-router'

import { AppLayout } from './App'
import { EmployeesPage } from './features/employees/EmployeesPage'
import { LazyInsightsPage } from './features/insights/LazyInsightsPage'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/employees" replace /> },
      { path: 'employees', element: <EmployeesPage /> },
      {
        path: 'insights',
        element: <LazyInsightsPage />,
      },
      { path: '*', element: <Navigate to="/employees" replace /> },
    ],
  },
])
