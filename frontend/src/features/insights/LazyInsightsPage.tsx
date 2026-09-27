import { Center, Loader } from '@mantine/core'
import { lazy, Suspense } from 'react'

// Charts are the heaviest dependency; download them only when Insights is opened.
const InsightsPage = lazy(() => import('./InsightsPage').then((m) => ({ default: m.InsightsPage })))

export function LazyInsightsPage() {
  return (
    <Suspense
      fallback={
        <Center py="xl">
          <Loader />
        </Center>
      }
    >
      <InsightsPage />
    </Suspense>
  )
}
