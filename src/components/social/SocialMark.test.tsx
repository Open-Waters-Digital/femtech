import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { SocialMark } from '@/components/social/SocialMark'
import { SOCIAL_PLATFORMS } from '@/lib/social'

// No vitest globals, so testing-library cannot register its own cleanup.
afterEach(cleanup)

describe('SocialMark', () => {
  it.each(SOCIAL_PLATFORMS)('draws real path data for %s', (platform) => {
    const { container } = render(<SocialMark platform={platform} />)
    const d = container.querySelector('path')?.getAttribute('d') ?? ''
    // SVG path data opens with a moveto and is long; a label pasted by mistake is neither.
    expect(d).toMatch(/^M[\d.]/)
    expect(d.length).toBeGreaterThan(50)
  })
})
