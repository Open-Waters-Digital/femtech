import { DEFAULT_EVENT_TIMEZONE } from '@/lib/events/timezones'

/**
 * When an event is, in words, in the event's own time zone.
 *
 * Always the event's zone, never the reader's or the server's (Railway runs in
 * UTC): a panel at 11:40 in Amsterdam is listed at 11:40 CET. The short zone
 * name comes from Intl in en-GB, which gives CET and GST but GMT-8 for
 * California; that is still unambiguous, so it is used as it comes.
 */
export type EventTiming = {
  startsAt: string
  startsAt_tz?: string | null
  endsAt?: string | null
  allDay?: boolean | null
}

const LOCALE = 'en-GB'

function zoneOf(event: EventTiming): string {
  return event.startsAt_tz || DEFAULT_EVENT_TIMEZONE
}

type Parts = {
  weekday: string
  day: string
  month: string
  year: string
  time: string
  zone: string
}

function parts(iso: string, timeZone: string): Parts {
  const formatted = new Intl.DateTimeFormat(LOCALE, {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZoneName: 'short',
  }).formatToParts(new Date(iso))
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    formatted.find((part) => part.type === type)?.value ?? ''
  return {
    weekday: get('weekday'),
    day: get('day'),
    month: get('month'),
    year: get('year'),
    time: `${get('hour')}:${get('minute')}`,
    zone: get('timeZoneName'),
  }
}

/** The calendar day in a zone, as YYYY-MM-DD, for comparing days rather than instants. */
function localDay(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/**
 * "Monday 26 October 2026, 11:40 CET", "11–12 November 2026",
 * "30 November – 2 December 2026", "Monday 26 October 2026, 11:40–12:30 CET".
 */
export function formatEventWhen(event: EventTiming): string {
  const zone = zoneOf(event)
  const start = parts(event.startsAt, zone)
  const end = event.endsAt ? parts(event.endsAt, zone) : null
  const sameDay =
    !end || (end.day === start.day && end.month === start.month && end.year === start.year)

  if (sameDay) {
    const date = `${start.weekday} ${start.day} ${start.month} ${start.year}`
    if (event.allDay) return date
    const time = end && end.time !== start.time ? `${start.time}–${end.time}` : start.time
    return `${date}, ${time} ${start.zone}`
  }

  // Several days. The dates carry it; a start time, when known, follows.
  let range: string
  if (start.year !== end.year) {
    range = `${start.day} ${start.month} ${start.year} – ${end.day} ${end.month} ${end.year}`
  } else if (start.month !== end.month) {
    range = `${start.day} ${start.month} – ${end.day} ${end.month} ${end.year}`
  } else {
    range = `${start.day}–${end.day} ${end.month} ${end.year}`
  }
  return event.allDay ? range : `${range}, from ${start.time} ${start.zone}`
}

/**
 * Whether an event is over. A timed event is over once its end (or, without
 * one, its start) has passed; an all-day event once its last day has ended
 * where it is held, so a summit is not "past" on the morning of its last day.
 */
export function isPast(event: EventTiming, now: Date = new Date()): boolean {
  const last = new Date(event.endsAt ?? event.startsAt)
  if (event.allDay) return localDay(now, zoneOf(event)) > localDay(last, zoneOf(event))
  return now.getTime() > last.getTime()
}

/** Whether an event has begun: RSVP closes then. */
export function hasStarted(event: EventTiming, now: Date = new Date()): boolean {
  if (event.allDay)
    return localDay(now, zoneOf(event)) >= localDay(new Date(event.startsAt), zoneOf(event))
  return now.getTime() >= new Date(event.startsAt).getTime()
}

/** Upcoming soonest first; past most recent first. Decided per request, from `now`. */
export function splitEvents<T extends EventTiming>(
  events: readonly T[],
  now: Date = new Date(),
): { upcoming: T[]; past: T[] } {
  const byStart = (a: T, b: T) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  const upcoming = events.filter((event) => !isPast(event, now)).sort(byStart)
  const past = events.filter((event) => isPast(event, now)).sort((a, b) => byStart(b, a))
  return { upcoming, past }
}
