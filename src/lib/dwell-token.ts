import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * A signed timestamp proving the form was on screen for a plausible interval.
 *
 * Bots post immediately and often replay the same payload. A token saying when
 * the form was rendered catches both — but only if the client cannot forge it,
 * so a plain `renderedAt` field in the body is worthless.
 *
 * Signed with PAYLOAD_SECRET rather than a new variable. That secret already
 * exists in every environment, and adding another one to manage is a way to have
 * it missing in production.
 *
 * The sign-up page renders per request and mints one into the form, so the form
 * works without JavaScript. /join/token issues a fresh one when a page left
 * open has let its token expire.
 */

const MIN_DWELL_MS = 3_000

/**
 * Two hours. Long enough for someone to open the page, get called away and come
 * back; a token that expires under a genuine visitor is the one failure these
 * layers must not cause, because an expired token is answered with a message
 * and a fresh token rather than silently.
 */
const MAX_AGE_MS = 2 * 60 * 60 * 1000

function secret(): string {
  const value = process.env.PAYLOAD_SECRET
  // Fail closed and loudly. A missing secret must not silently disable the
  // check, which is exactly the window an attacker waits for.
  if (!value) throw new Error('PAYLOAD_SECRET is required to sign form tokens.')
  return value
}

function sign(issuedAt: number): string {
  return createHmac('sha256', secret()).update(String(issuedAt)).digest('hex')
}

export function mintDwellToken(now: number = Date.now()): string {
  return `${now}.${sign(now)}`
}

export type DwellResult = 'valid' | 'malformed' | 'forged' | 'too-fast' | 'expired'

export function verifyDwellToken(
  token: string,
  now: number = Date.now(),
  maxAgeMs: number = MAX_AGE_MS,
): DwellResult {
  const parts = token.split('.')
  if (parts.length !== 2) return 'malformed'

  const [issuedRaw, provided] = parts
  if (!issuedRaw || !provided) return 'malformed'

  const issuedAt = Number(issuedRaw)
  if (!Number.isInteger(issuedAt) || issuedAt <= 0) return 'malformed'

  const expected = sign(issuedAt)
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(provided, 'utf8')

  // Length check first: timingSafeEqual throws on a mismatch rather than
  // returning false.
  if (a.length !== b.length || !timingSafeEqual(a, b)) return 'forged'

  const age = now - issuedAt
  // A negative age means clock skew or a fabricated future timestamp. Either
  // way it is not a form someone filled in.
  if (age < MIN_DWELL_MS) return 'too-fast'
  if (age > maxAgeMs) return 'expired'

  return 'valid'
}
