import { describe, expect, it } from 'vitest'

import { formatEventWhen, hasStarted, isPast, splitEvents } from '@/lib/events/format'

/** The seeded Field Service Europe panel: 11:40 in Amsterdam, after the clocks go back. */
const PANEL = { startsAt: '2026-10-26T10:40:00.000Z', startsAt_tz: 'Europe/Amsterdam' }

/** The seeded Revive ME summit: two days in Abu Dhabi, dates only. */
const SUMMIT = {
  startsAt: '2026-11-11T05:00:00.000Z',
  endsAt: '2026-11-12T14:00:00.000Z',
  startsAt_tz: 'Asia/Dubai',
  allDay: true,
}

describe('formatEventWhen', () => {
  it('shows a single timed event in its own zone', () => {
    // Whatever the machine's zone: CI and Railway run in UTC.
    expect(formatEventWhen(PANEL)).toBe('Monday 26 October 2026, 11:40 CET')
  })

  it('shows a start and end on the same day as a time range', () => {
    expect(formatEventWhen({ ...PANEL, endsAt: '2026-10-26T11:30:00.000Z' })).toBe(
      'Monday 26 October 2026, 11:40–12:30 CET',
    )
  })

  it('shows a same-month range of days', () => {
    expect(formatEventWhen(SUMMIT)).toBe('11–12 November 2026')
  })

  it('shows a cross-month range, and a cross-year one', () => {
    expect(
      formatEventWhen({
        startsAt: '2026-11-30T09:00:00.000Z',
        endsAt: '2026-12-02T17:00:00.000Z',
        startsAt_tz: 'Europe/London',
        allDay: true,
      }),
    ).toBe('30 November – 2 December 2026')
    expect(
      formatEventWhen({
        startsAt: '2026-12-30T09:00:00.000Z',
        endsAt: '2027-01-02T17:00:00.000Z',
        startsAt_tz: 'Europe/London',
        allDay: true,
      }),
    ).toBe('30 December 2026 – 2 January 2027')
  })

  it('adds the start time to a timed range of days', () => {
    expect(formatEventWhen({ ...SUMMIT, allDay: false })).toBe(
      '11–12 November 2026, from 09:00 GST',
    )
  })

  it('shows an all-day single day without a time', () => {
    expect(formatEventWhen({ ...PANEL, allDay: true })).toBe('Monday 26 October 2026')
  })

  it('reads the date in the event’s zone, not UTC', () => {
    // 1 March 2027, 17:00 in California is 2 March in UTC.
    expect(
      formatEventWhen({
        startsAt: '2027-03-02T01:00:00.000Z',
        startsAt_tz: 'America/Los_Angeles',
      }),
    ).toBe('Monday 1 March 2027, 17:00 GMT-8')
  })
})

describe('isPast', () => {
  it('moves a timed event to past once it has started, without an end', () => {
    expect(isPast(PANEL, new Date('2026-10-26T10:39:00.000Z'))).toBe(false)
    expect(isPast(PANEL, new Date('2026-10-26T10:41:00.000Z'))).toBe(true)
  })

  it('keeps an event with an end upcoming until the end', () => {
    const withEnd = { ...PANEL, endsAt: '2026-10-26T11:30:00.000Z' }
    expect(isPast(withEnd, new Date('2026-10-26T11:00:00.000Z'))).toBe(false)
    expect(isPast(withEnd, new Date('2026-10-26T11:31:00.000Z'))).toBe(true)
  })

  it('keeps an all-day event upcoming until its last day is over where it is held', () => {
    // 23:30 on 12 November in Abu Dhabi.
    expect(isPast(SUMMIT, new Date('2026-11-12T19:30:00.000Z'))).toBe(false)
    // 00:30 on 13 November in Abu Dhabi.
    expect(isPast(SUMMIT, new Date('2026-11-12T20:30:00.000Z'))).toBe(true)
  })
})

describe('hasStarted', () => {
  it('starts a timed event at its start', () => {
    expect(hasStarted(PANEL, new Date('2026-10-26T10:39:00.000Z'))).toBe(false)
    expect(hasStarted(PANEL, new Date('2026-10-26T10:40:00.000Z'))).toBe(true)
  })

  it('starts an all-day event on its first day, where it is held', () => {
    expect(hasStarted(SUMMIT, new Date('2026-11-10T19:59:00.000Z'))).toBe(false)
    expect(hasStarted(SUMMIT, new Date('2026-11-10T20:01:00.000Z'))).toBe(true)
  })
})

describe('splitEvents', () => {
  const MEDICAL = { startsAt: '2027-03-01T17:00:00.000Z', startsAt_tz: 'America/Los_Angeles' }
  const OLD = { startsAt: '2026-01-10T10:00:00.000Z', startsAt_tz: 'Europe/London' }
  const OLDER = { startsAt: '2025-06-10T10:00:00.000Z', startsAt_tz: 'Europe/London' }

  it('lists upcoming soonest first and past most recent first', () => {
    const { upcoming, past } = splitEvents(
      [MEDICAL, OLDER, SUMMIT, PANEL, OLD],
      new Date('2026-10-20T09:00:00.000Z'),
    )
    expect(upcoming).toEqual([PANEL, SUMMIT, MEDICAL])
    expect(past).toEqual([OLD, OLDER])
  })

  it('moves an event to past with time alone, without anyone saving it', () => {
    const before = splitEvents([PANEL], new Date('2026-10-26T10:00:00.000Z'))
    const after = splitEvents([PANEL], new Date('2026-10-26T12:00:00.000Z'))
    expect(before.upcoming).toHaveLength(1)
    expect(after.past).toHaveLength(1)
  })
})
