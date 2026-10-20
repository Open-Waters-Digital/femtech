import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { RollingLabel } from '@/components/primitives/RollingLabel'

describe('RollingLabel', () => {
  it('names its link once and whole, not letter by letter', () => {
    render(
      <a href="#about">
        <RollingLabel text="About Us" by="chars" />
      </a>,
    )
    expect(screen.getByRole('link').textContent).toContain('About Us')
    expect(screen.getByRole('link', { name: 'About Us' })).toBeTruthy()
  })

  it('hides both drawn copies from assistive technology', () => {
    const { container } = render(<RollingLabel text="Sign Up" by="words" />)
    const roll = container.querySelector('.roll')
    expect(roll?.getAttribute('aria-hidden')).toBe('true')
    expect(roll?.querySelectorAll('.roll-line')).toHaveLength(2)
  })
})
