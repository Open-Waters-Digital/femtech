import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/** Client navigation, with the package replaced by spies. */
const analytics = vi.hoisted(() => ({ initAnalytics: vi.fn(), pageChanged: vi.fn() }))
vi.mock('@open-waters-digital/analytics/browser', () => analytics)

const route = vi.hoisted(() => ({ pathname: '/' }))
vi.mock('next/navigation', () => ({ usePathname: () => route.pathname }))

const { Analytics } = await import('./Analytics')

beforeEach(() => {
  vi.clearAllMocks()
  route.pathname = '/'
  vi.stubEnv('NODE_ENV', 'production')
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'phc_test')
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_HOST', 'https://e.femtechhealth.com')
})

afterEach(() => {
  cleanup()
  document.head.querySelectorAll('meta[name="robots"]').forEach((meta) => meta.remove())
  vi.unstubAllEnvs()
})

describe('Analytics on client navigation', () => {
  it('starts as femtech, spa, unregulated, without heatmaps', () => {
    render(<Analytics indexable />)
    expect(analytics.initAnalytics).toHaveBeenCalledWith(
      expect.objectContaining({ site: 'femtech', spa: true, regulated: false, heatmaps: false }),
    )
  })

  it('reports a page change on navigation, not on the first render', () => {
    const { rerender } = render(<Analytics indexable />)
    expect(analytics.pageChanged).not.toHaveBeenCalled()
    route.pathname = '/about-us'
    rerender(<Analytics indexable />)
    expect(analytics.pageChanged).toHaveBeenCalledTimes(1)
  })

  it('reports nothing on navigation when it never started', () => {
    const { rerender } = render(<Analytics indexable={false} />)
    route.pathname = '/about-us'
    rerender(<Analytics indexable={false} />)
    expect(analytics.initAnalytics).not.toHaveBeenCalled()
    expect(analytics.pageChanged).not.toHaveBeenCalled()
  })

  it('reports no page change into a noindex page', () => {
    const { rerender } = render(<Analytics indexable />)
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex'
    document.head.append(meta)
    route.pathname = '/sign-up/thank-you'
    rerender(<Analytics indexable />)
    expect(analytics.pageChanged).not.toHaveBeenCalled()
  })
})
