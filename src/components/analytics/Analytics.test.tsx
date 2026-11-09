import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Uses the real package, with posthog-js replaced by a stand-in that counts its
 * imports: the package only imports posthog-js once it has started, so a count
 * of zero means nothing was loaded and nothing could have been sent.
 */
const posthog = vi.hoisted(() => ({ imports: 0 }))
vi.mock('posthog-js', () => {
  posthog.imports += 1
  return { default: { init: () => {} } }
})
vi.mock('next/navigation', () => ({ usePathname: () => '/' }))

const LIVE = {
  NODE_ENV: 'production',
  NEXT_PUBLIC_POSTHOG_KEY: 'phc_test',
  NEXT_PUBLIC_POSTHOG_HOST: 'https://e.femtechhealth.com',
}

async function mountWith(
  env: Partial<Record<keyof typeof LIVE, string>>,
  indexable = true,
): Promise<number> {
  vi.resetModules()
  posthog.imports = 0
  for (const [name, value] of Object.entries({ ...LIVE, ...env })) vi.stubEnv(name, value)
  const { Analytics } = await import('./Analytics')
  render(<Analytics indexable={indexable} />)
  // Idle callbacks run at once, so any load has been attempted by now.
  await new Promise((resolve) => setTimeout(resolve, 20))
  return posthog.imports
}

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('requestIdleCallback', (callback: () => void) => {
    callback()
    return 0
  })
})

afterEach(() => {
  cleanup()
  document.head.querySelectorAll('meta[name="robots"]').forEach((meta) => meta.remove())
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('Analytics', () => {
  it('starts in production, indexable, with a key and host, unframed', async () => {
    expect(await mountWith({})).toBe(1)
  })

  it.each([
    ['a development build', { NODE_ENV: 'development' }],
    ['a missing key', { NEXT_PUBLIC_POSTHOG_KEY: '' }],
    ['a missing host', { NEXT_PUBLIC_POSTHOG_HOST: '' }],
  ])('loads nothing for %s', async (_label, env) => {
    expect(await mountWith(env)).toBe(0)
  })

  it('loads nothing on an instance that is not indexable (preview, local)', async () => {
    expect(await mountWith({}, false)).toBe(0)
  })

  it('loads nothing inside a frame, as in the admin', async () => {
    vi.spyOn(window, 'top', 'get').mockReturnValue({} as Window)
    expect(await mountWith({})).toBe(0)
  })

  it('loads nothing on a page marked noindex', async () => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.append(meta)
    expect(await mountWith({})).toBe(0)
  })

  it('loads nothing for a visitor who objected', async () => {
    localStorage.setItem('ow-analytics-objection', '1')
    expect(await mountWith({})).toBe(0)
  })
})
