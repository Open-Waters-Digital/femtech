import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { mintDwellToken, verifyDwellToken } from '@/lib/dwell-token'

/**
 * The dwell token's failure modes.
 *
 * The happy path is one test and the other nine are attacks or mistakes, which
 * is the right ratio: this exists to reject things, and a test suite that only
 * proves it accepts a valid token proves nothing about what it is for.
 */

const SECRET = 'test-secret-not-used-anywhere-real'
let previousSecret: string | undefined

beforeAll(() => {
  previousSecret = process.env.PAYLOAD_SECRET
  process.env.PAYLOAD_SECRET = SECRET
})

afterAll(() => {
  if (previousSecret === undefined) delete process.env.PAYLOAD_SECRET
  else process.env.PAYLOAD_SECRET = previousSecret
})

const NOW = 1_700_000_000_000
/** Past the 3s floor, well inside the 2h ceiling. */
const PLAUSIBLE = NOW + 10_000

describe('verifyDwellToken', () => {
  it('accepts a token it minted, after a plausible pause', () => {
    expect(verifyDwellToken(mintDwellToken(NOW), PLAUSIBLE)).toBe('valid')
  })

  it('rejects a token with no signature', () => {
    expect(verifyDwellToken(String(NOW), PLAUSIBLE)).toBe('malformed')
  })

  it('rejects a token with too many parts', () => {
    expect(verifyDwellToken(`${NOW}.abc.def`, PLAUSIBLE)).toBe('malformed')
  })

  it('rejects a non-numeric timestamp', () => {
    expect(verifyDwellToken('not-a-number.abc', PLAUSIBLE)).toBe('malformed')
  })

  it('rejects an empty string', () => {
    expect(verifyDwellToken('', PLAUSIBLE)).toBe('malformed')
  })

  it('rejects a forged signature', () => {
    const forged = `${NOW}.${'0'.repeat(64)}`
    expect(verifyDwellToken(forged, PLAUSIBLE)).toBe('forged')
  })

  it('rejects a signature of the wrong length without throwing', () => {
    // timingSafeEqual throws on a length mismatch rather than returning false,
    // so the length check has to come first. This is the test that catches it
    // being reordered.
    expect(() => verifyDwellToken(`${NOW}.short`, PLAUSIBLE)).not.toThrow()
    expect(verifyDwellToken(`${NOW}.short`, PLAUSIBLE)).toBe('forged')
  })

  it('rejects a valid signature moved onto a different timestamp', () => {
    // The attack the HMAC exists to stop: take a real token and change the time
    // it claims to have been issued.
    const token = mintDwellToken(NOW)
    const signature = token.split('.')[1]
    expect(verifyDwellToken(`${NOW + 60_000}.${signature}`, PLAUSIBLE)).toBe('forged')
  })

  it('rejects a post that arrived too fast to have been typed', () => {
    expect(verifyDwellToken(mintDwellToken(NOW), NOW + 500)).toBe('too-fast')
  })

  it('rejects a token issued in the future', () => {
    // Clock skew or a fabricated timestamp. Either way it is not a form someone
    // filled in, and it must not be treated as merely early.
    expect(verifyDwellToken(mintDwellToken(NOW + 60_000), NOW)).toBe('too-fast')
  })

  it('rejects a token older than the window', () => {
    const threeHours = 3 * 60 * 60 * 1000
    expect(verifyDwellToken(mintDwellToken(NOW), NOW + threeHours)).toBe('expired')
  })

  it('still accepts one ninety minutes old, for someone who was called away', () => {
    const ninetyMinutes = 90 * 60 * 1000
    expect(verifyDwellToken(mintDwellToken(NOW), NOW + ninetyMinutes)).toBe('valid')
  })

  it('refuses to verify at all when the secret is missing', () => {
    // Fail closed and loudly. A missing secret silently disabling the check is
    // exactly the window an attacker waits for.
    const token = mintDwellToken(NOW)
    delete process.env.PAYLOAD_SECRET
    expect(() => verifyDwellToken(token, PLAUSIBLE)).toThrow(/PAYLOAD_SECRET/)
    process.env.PAYLOAD_SECRET = SECRET
  })
})
