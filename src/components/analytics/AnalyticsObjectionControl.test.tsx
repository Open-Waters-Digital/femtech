import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  AnalyticsObjectionControl,
  OBJECT_FALLBACK,
  STATUS,
  WITHDRAW_FALLBACK,
} from './AnalyticsObjectionControl'

const analytics = vi.hoisted(() => ({
  hasObjected: vi.fn(() => false),
  setAnalyticsObjection: vi.fn(),
}))
vi.mock('@open-waters-digital/analytics/browser', () => analytics)

beforeEach(() => {
  vi.clearAllMocks()
  analytics.hasObjected.mockReturnValue(false)
})

afterEach(cleanup)

describe('AnalyticsObjectionControl', () => {
  it('is disabled in the server markup, saying it needs JavaScript', () => {
    const html = renderToString(<AnalyticsObjectionControl />)
    expect(html).toMatch(/<button[^>]*disabled/)
    expect(html).toContain('This control needs JavaScript')
    expect(analytics.hasObjected).not.toHaveBeenCalled()
  })

  it('offers to object once mounted, for a visitor being measured', () => {
    render(<AnalyticsObjectionControl objectLabel="Stop measuring me" withdrawLabel="Resume" />)
    const button = screen.getByRole('button', { name: 'Stop measuring me' })
    expect(button.hasAttribute('disabled')).toBe(false)
    expect(button.getAttribute('aria-pressed')).toBe('false')
    expect(screen.getByRole('status').textContent).toBe(STATUS.measuring)
  })

  it('offers to withdraw for a visitor who objected, and says so', () => {
    analytics.hasObjected.mockReturnValue(true)
    render(<AnalyticsObjectionControl objectLabel="Stop measuring me" withdrawLabel="Resume" />)
    expect(screen.getByRole('button', { name: 'Resume' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('status').textContent).toBe(STATUS.objected)
  })

  it('falls back to plain wording without labels', () => {
    const { unmount } = render(<AnalyticsObjectionControl />)
    expect(screen.getByRole('button', { name: OBJECT_FALLBACK })).toBeTruthy()
    unmount()
    analytics.hasObjected.mockReturnValue(true)
    render(<AnalyticsObjectionControl objectLabel="" withdrawLabel={null} />)
    expect(screen.getByRole('button', { name: WITHDRAW_FALLBACK })).toBeTruthy()
  })

  it('stores an objection', () => {
    render(<AnalyticsObjectionControl />)
    fireEvent.click(screen.getByRole('button'))
    expect(analytics.setAnalyticsObjection).toHaveBeenCalledWith(true)
  })

  it('withdraws one', () => {
    analytics.hasObjected.mockReturnValue(true)
    render(<AnalyticsObjectionControl />)
    fireEvent.click(screen.getByRole('button'))
    expect(analytics.setAnalyticsObjection).toHaveBeenCalledWith(false)
  })

  it('stores nothing from a showcase preview', () => {
    render(<AnalyticsObjectionControl preview="measuring" />)
    fireEvent.click(screen.getByRole('button'))
    expect(analytics.setAnalyticsObjection).not.toHaveBeenCalled()
  })
})
