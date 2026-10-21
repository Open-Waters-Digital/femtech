import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { EventCard } from '@/components/events/EventCard'
import { SAMPLE_EVENTS } from '@/components/events/fixtures'

// No vitest globals, so testing-library cannot register its own cleanup.
afterEach(cleanup)

describe('EventCard', () => {
  it('links a speaking engagement to the organiser, in a new tab, as one link', () => {
    render(<EventCard event={SAMPLE_EVENTS.speaking} />)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(1)
    const link = links[0]
    expect(link?.getAttribute('href')).toBe(SAMPLE_EVENTS.speaking.organiserUrl)
    expect(link?.getAttribute('target')).toBe('_blank')
    expect(link?.getAttribute('rel')).toContain('noopener')
    expect(link?.textContent).toContain('opens in a new tab')
  })

  it('shows the time in the event’s zone, the place, the speaker and the session', () => {
    render(<EventCard event={SAMPLE_EVENTS.speaking} />)
    expect(screen.getByText('Monday 26 October 2026, 11:40 CET')).toBeTruthy()
    expect(screen.getByText('Amsterdam, Netherlands')).toBeTruthy()
    expect(screen.getByText('Tanya AH Singh')).toBeTruthy()
    expect(screen.getByText(/Panel: Evolving the Service Value Proposition/)).toBeTruthy()
  })

  it('lists a speaking engagement without an organiser page as text, not a link', () => {
    render(<EventCard event={SAMPLE_EVENTS.speakingNoLink} />)
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByRole('heading', { name: SAMPLE_EVENTS.speakingNoLink.title })).toBeTruthy()
  })

  it('says the topic is to be confirmed when there is no session title', () => {
    render(<EventCard event={SAMPLE_EVENTS.speakingNoLink} />)
    expect(screen.getByText('Topic to be confirmed')).toBeTruthy()
    expect(screen.getByText(/Role to be confirmed/)).toBeTruthy()
  })

  it('shows a multi-day, all-day event as a range of dates', () => {
    render(<EventCard event={SAMPLE_EVENTS.speakingNoLink} />)
    expect(screen.getByText('11–12 November 2026')).toBeTruthy()
  })

  it('links a hosted event to its own page and shows its RSVP state', () => {
    render(<EventCard event={SAMPLE_EVENTS.hosted} badge="full" />)
    const link = screen.getByRole('link', { name: 'Winter Speakeasy' })
    expect(link.getAttribute('href')).toBe('/events/winter-speakeasy')
    expect(link.getAttribute('target')).toBeNull()
    expect(screen.getByText('Full')).toBeTruthy()
  })

  it('says "Online" in place of a venue', () => {
    render(<EventCard event={SAMPLE_EVENTS.online} />)
    expect(screen.getByText('Online')).toBeTruthy()
  })

  it('marks a past event', () => {
    render(<EventCard event={SAMPLE_EVENTS.past} past />)
    expect(screen.getByText(/· Past/)).toBeTruthy()
  })
})
