import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { mintDwellToken } from '@/lib/dwell-token'
import { mintWithdrawToken, readWithdrawToken } from '@/lib/events/withdraw-token'

let saved: string | undefined
beforeEach(() => {
  saved = process.env.PAYLOAD_SECRET
  process.env.PAYLOAD_SECRET = 'test-secret'
})
afterEach(() => {
  if (saved === undefined) delete process.env.PAYLOAD_SECRET
  else process.env.PAYLOAD_SECRET = saved
})

describe('withdraw token', () => {
  it('reads back the registration it was minted for', () => {
    expect(readWithdrawToken(mintWithdrawToken(42))).toBe(42)
    expect(readWithdrawToken(mintWithdrawToken(1))).toBe(1)
  })

  it('is safe to put in a URL as it is', () => {
    expect(mintWithdrawToken(42)).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/)
  })

  it('refuses a token whose id was changed to another registration', () => {
    const [, signature] = mintWithdrawToken(42).split('.')
    const otherId = Buffer.from('43').toString('base64url')
    expect(readWithdrawToken(`${otherId}.${signature}`)).toBeNull()
  })

  it('refuses a token whose signature was changed', () => {
    const token = mintWithdrawToken(42)
    const last = token.at(-1) === 'A' ? 'B' : 'A'
    expect(readWithdrawToken(token.slice(0, -1) + last)).toBeNull()
  })

  it('refuses a token signed with another secret', () => {
    const token = mintWithdrawToken(42)
    process.env.PAYLOAD_SECRET = 'another-secret'
    expect(readWithdrawToken(token)).toBeNull()
  })

  it('refuses a dwell token presented as a withdraw token', () => {
    expect(readWithdrawToken(mintDwellToken())).toBeNull()
  })

  it('refuses malformed input', () => {
    for (const token of [
      null,
      undefined,
      '',
      'abc',
      'a.b.c',
      '.sig',
      'id.',
      `${Buffer.from('0').toString('base64url')}.x`,
      `${Buffer.from('-1').toString('base64url')}.x`,
      `${Buffer.from('1e3').toString('base64url')}.x`,
      'x'.repeat(500),
    ]) {
      expect(readWithdrawToken(token)).toBeNull()
    }
  })

  it('throws rather than signing without a secret', () => {
    delete process.env.PAYLOAD_SECRET
    expect(() => mintWithdrawToken(42)).toThrow(/PAYLOAD_SECRET/)
  })
})
