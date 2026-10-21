import type { Timezone } from 'payload'

/**
 * The zones an event can be in, as the admin offers them. Payload's own list
 * has Berlin but not Amsterdam or Paris; an editor setting up an Amsterdam
 * event should find Amsterdam. Add a city here when an event needs it.
 *
 * The time is always shown in the event's zone, never the visitor's: a talk at
 * 11:40 in Amsterdam is at 11:40, and the listing says which zone.
 *
 * Stored as a Postgres enum, so a new city here also needs a migration
 * (`pnpm run migrate:create`), which adds the value to the enum.
 */
export const EVENT_TIMEZONES: Timezone[] = [
  { label: 'London', value: 'Europe/London' },
  { label: 'Dublin', value: 'Europe/Dublin' },
  { label: 'Amsterdam', value: 'Europe/Amsterdam' },
  { label: 'Paris', value: 'Europe/Paris' },
  { label: 'Berlin', value: 'Europe/Berlin' },
  { label: 'Madrid', value: 'Europe/Madrid' },
  { label: 'Stockholm', value: 'Europe/Stockholm' },
  { label: 'Dubai / Abu Dhabi', value: 'Asia/Dubai' },
  { label: 'Riyadh', value: 'Asia/Riyadh' },
  { label: 'Mumbai', value: 'Asia/Kolkata' },
  { label: 'Singapore', value: 'Asia/Singapore' },
  { label: 'Sydney', value: 'Australia/Sydney' },
  { label: 'New York', value: 'America/New_York' },
  { label: 'Chicago', value: 'America/Chicago' },
  { label: 'Los Angeles / San Diego', value: 'America/Los_Angeles' },
  { label: 'Toronto', value: 'America/Toronto' },
]

export const DEFAULT_EVENT_TIMEZONE = 'Europe/London'
