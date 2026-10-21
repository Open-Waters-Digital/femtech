import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * The token in an RSVP confirmation's withdraw link: the registration's id and
 * an HMAC of it, so only the person who received the email can withdraw that
 * one place, and an edited id is refused.
 *
 * Signed with PAYLOAD_SECRET, like the dwell token, but over `withdraw:<id>`
 * rather than a bare value. The prefix separates the two: a dwell token can
 * never be presented as a withdraw token, or the other way round.
 *
 * No expiry of its own. It stops working when the event has ended, which the
 * withdraw route checks, and the worst a forwarded email allows is freeing that
 * one person's place.
 */

function secret(): string {
  const value = process.env.PAYLOAD_SECRET
  // Fail closed and loudly, as the dwell token does.
  if (!value) throw new Error('PAYLOAD_SECRET is required to sign withdraw links.')
  return value
}

function signature(registrationId: number): Buffer {
  return createHmac('sha256', secret()).update(`withdraw:${registrationId}`).digest()
}

export function mintWithdrawToken(registrationId: number): string {
  const id = Buffer.from(String(registrationId)).toString('base64url')
  return `${id}.${signature(registrationId).toString('base64url')}`
}

/** The registration's id, or null for anything not minted here. */
export function readWithdrawToken(token: string | null | undefined): number | null {
  if (!token || token.length > 200) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [encodedId, encodedSignature] = parts
  if (!encodedId || !encodedSignature) return null

  const raw = Buffer.from(encodedId, 'base64url').toString('utf8')
  if (!/^[1-9]\d{0,15}$/.test(raw)) return null
  const registrationId = Number(raw)

  const provided = Buffer.from(encodedSignature, 'base64url')
  const expected = signature(registrationId)
  if (provided.length !== expected.length) return null
  return timingSafeEqual(provided, expected) ? registrationId : null
}
