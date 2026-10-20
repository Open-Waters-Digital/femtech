import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { SocialLinks } from '@/components/social/SocialLinks'

// No vitest globals, so testing-library cannot register its own cleanup.
afterEach(cleanup)

describe('SocialLinks', () => {
  it('renders nothing without profiles', () => {
    const { container } = render(<SocialLinks social={[]} />)
    expect(container.innerHTML).toBe('')
    expect(render(<SocialLinks social={null} />).container.innerHTML).toBe('')
  })

  it('keeps the configured order and names each link by its platform', () => {
    render(
      <SocialLinks
        social={[
          { platform: 'linkedin', href: 'https://www.linkedin.com/company/femtech' },
          { platform: 'instagram', href: 'https://www.instagram.com/femtech' },
        ]}
      />,
    )
    const links = screen.getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual(['LinkedIn', 'Instagram'])
    expect(screen.getByRole('link', { name: 'LinkedIn' }).getAttribute('href')).toBe(
      'https://www.linkedin.com/company/femtech',
    )
  })

  it('opens a profile in a new tab without handing it the opener', () => {
    render(<SocialLinks social={[{ platform: 'x', href: 'https://x.com/femtech' }]} />)
    const link = screen.getByRole('link', { name: 'X' })
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
  })

  it('hides the mark itself from assistive technology', () => {
    const { container } = render(
      <SocialLinks social={[{ platform: 'facebook', href: 'https://facebook.com/femtech' }]} />,
    )
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
  })
})
