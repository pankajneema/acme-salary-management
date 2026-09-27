import { MantineProvider } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { Notifications } from '@mantine/notifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'

import { theme } from '../theme'

/** Render a page with the same providers as the app, at a given URL. */
export function renderPage(
  element: ReactElement,
  { path = '/', url }: { path?: string; url?: string } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const router = createMemoryRouter([{ path, element }], { initialEntries: [url ?? path] })
  const utils = render(
    <MantineProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <ModalsProvider>
          <Notifications />
          <RouterProvider router={router} />
        </ModalsProvider>
      </QueryClientProvider>
    </MantineProvider>,
  )
  return { ...utils, router }
}

type Handler = (url: URL, init?: RequestInit) => unknown

/** Stub fetch with a small router: path -> handler returning a JSON body (or a Response). */
export function mockApi(routes: Record<string, Handler>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'http://localhost')
    const key = `${init?.method ?? 'GET'} ${url.pathname}`
    const handler = routes[key]
    if (!handler) return new Response(JSON.stringify({ detail: 'Not mocked' }), { status: 404 })
    const result = handler(url, init)
    return result instanceof Response
      ? result
      : new Response(JSON.stringify(result), { status: 200 })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/** Every URL the app requested for a given path, for asserting on query parameters. */
export function requestedUrls(fetchMock: ReturnType<typeof mockApi>, pathname: string): URL[] {
  return fetchMock.mock.calls
    .map(([input]) => new URL(String(input), 'http://localhost'))
    .filter((url) => url.pathname === pathname)
}
