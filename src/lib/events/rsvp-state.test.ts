import { describe, expect, it } from 'vitest'

import { type RsvpEvent, rsvpState } from '@/lib/events/rsvp-state'

const EVENT: RsvpEvent = {
  status: 'published',
  startsAt: '2026-12-03T18:30:00.000Z',
  startsAt_tz: 'Europe/London',
  capacity: 20,
}
const BEFORE = new Date('2026-11-01T12:00:00.000Z')

describe('rsvpState', () => {
  it('is open with places left, and says how many', () => {
    expect(rsvpState(EVENT, 19, BEFORE)).toEqual({ state: 'open', remaining: 1 })
  })

  it('is full once confirmed places reach capacity', () => {
    expect(rsvpState(EVENT, 20, BEFORE)).toEqual({ state: 'full' })
    expect(rsvpState(EVENT, 25, BEFORE)).toEqual({ state: 'full' })
  })

  it('has no limit without a capacity', () => {
    expect(rsvpState({ ...EVENT, capacity: null }, 500, BEFORE)).toEqual({
      state: 'open',
      remaining: null,
    })
  })

  it('closes at the RSVP deadline', () => {
    const event = { ...EVENT, rsvpClosesAt: '2026-11-30T23:59:00.000Z' }
    expect(rsvpState(event, 0, new Date('2026-11-30T23:58:00.000Z')).state).toBe('open')
    expect(rsvpState(event, 0, new Date('2026-11-30T23:59:00.000Z'))).toEqual({
      state: 'closed',
      reason: 'deadline',
    })
  })

  it('closes when the event starts, deadline or not', () => {
    expect(rsvpState(EVENT, 0, new Date('2026-12-03T18:30:00.000Z'))).toEqual({
      state: 'closed',
      reason: 'started',
    })
  })

  it('is cancelled for a cancelled event, whatever else is true', () => {
    expect(rsvpState({ ...EVENT, status: 'cancelled' }, 0, BEFORE)).toEqual({ state: 'cancelled' })
  })

  it('is closed for an event that is not published', () => {
    expect(rsvpState({ ...EVENT, status: 'draft' }, 0, BEFORE)).toEqual({
      state: 'closed',
      reason: 'unpublished',
    })
  })
})
