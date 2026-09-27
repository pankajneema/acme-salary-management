import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { employee, meta, page } from '../../test/fixtures'
import { mockApi, renderPage, requestedUrls } from '../../test/render'
import { EmployeesPage } from './EmployeesPage'

const alice = employee()
const asha = employee({
  id: 2,
  employee_code: 'EMP-00002',
  full_name: 'Asha Rao',
  email: 'asha.rao@acme.com',
  country_code: 'IN',
  country_name: 'India',
  currency: 'INR',
  salary: 2500000,
  salary_usd: 30000,
})

function renderEmployeesPage(url = '/employees') {
  const fetchMock = mockApi({
    'GET /api/meta': () => meta,
    'GET /api/employees': () => page([alice, asha]),
  })
  const utils = renderPage(<EmployeesPage />, { path: '/employees', url })
  return { ...utils, fetchMock }
}

afterEach(() => vi.unstubAllGlobals())

describe('EmployeesPage', () => {
  it('shows employees with local salary and a USD equivalent', async () => {
    renderEmployeesPage()

    const row = (await screen.findByText('Asha Rao')).closest('tr')!
    expect(within(row).getByText('₹25,00,000')).toBeInTheDocument()
    expect(within(row).getByText('≈ $30,000')).toBeInTheDocument()
    expect(screen.getByText('Showing 1–2 of 2')).toBeInTheDocument()
  })

  it('sends the search term to the API after the user stops typing', async () => {
    const user = userEvent.setup()
    const { fetchMock } = renderEmployeesPage()
    await screen.findByText('Alice Smith')

    await user.type(screen.getByLabelText('Search'), 'rao')

    await waitFor(() =>
      expect(
        requestedUrls(fetchMock, '/api/employees').some(
          (u) => u.searchParams.get('search') === 'rao',
        ),
      ).toBe(true),
    )
    // Debounced: no request for the partial terms "r" or "ra".
    const searches = requestedUrls(fetchMock, '/api/employees').map((u) =>
      u.searchParams.get('search'),
    )
    expect(searches).not.toContain('r')
  })

  it('sorts by USD salary when the salary header is clicked, then toggles the order', async () => {
    const user = userEvent.setup()
    const { fetchMock, router } = renderEmployeesPage()
    await screen.findByText('Alice Smith')

    await user.click(screen.getByRole('button', { name: /annual salary/i }))
    await waitFor(() => expect(router.state.location.search).toContain('sort=salary_usd'))
    expect(router.state.location.search).toContain('order=asc')

    await user.click(screen.getByRole('button', { name: /annual salary/i }))
    await waitFor(() => expect(router.state.location.search).toContain('order=desc'))
    const last = requestedUrls(fetchMock, '/api/employees').at(-1)!
    expect(last.searchParams.get('sort')).toBe('salary_usd')
    expect(last.searchParams.get('order')).toBe('desc')
  })

  it('restores filters from the URL so views can be shared', async () => {
    const { fetchMock } = renderEmployeesPage('/employees?country=IN&page=2')
    await screen.findByText('Alice Smith')

    const first = requestedUrls(fetchMock, '/api/employees')[0]
    expect(first.searchParams.get('country')).toBe('IN')
    expect(first.searchParams.get('page')).toBe('2')
  })

  it('shows validation errors instead of submitting an empty form', async () => {
    const user = userEvent.setup()
    const { fetchMock } = renderEmployeesPage()
    await screen.findByText('Alice Smith')

    await user.click(screen.getByRole('button', { name: 'Add employee' }))
    const drawer = await screen.findByRole('dialog')
    await user.click(within(drawer).getByRole('button', { name: 'Add employee' }))

    expect(await within(drawer).findByText('Name is required')).toBeInTheDocument()
    expect(within(drawer).getByText('Salary is required')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false)
  })

  it('asks for confirmation before deleting', async () => {
    const user = userEvent.setup()
    const { fetchMock } = renderEmployeesPage()
    await screen.findByText('Alice Smith')

    await user.click(screen.getByRole('button', { name: 'Delete Alice Smith' }))

    expect(await screen.findByText('Delete Alice Smith?')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false)
  })
})
