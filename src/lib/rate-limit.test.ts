import { beforeEach, describe, expect, it } from 'vitest'

import { clientIp, rateLimit, resetRateLimit } from '@/lib/rate-limit'

describe('rateLimit', () => {
  beforeEach(resetRateLimit)

  const NOW = 1_700_000_000_000

  it('allows up to the limit and refuses the one after', () => {
    for (let i = 0; i < 5; i += 1) {
      expect(rateLimit('ip', NOW).allowed).toBe(true)
    }
    expect(rateLimit('ip', NOW).allowed).toBe(false)
  })

  it('counts each key separately, so one visitor cannot lock out another', () => {
    for (let i = 0; i < 5; i += 1) rateLimit('first', NOW)
    expect(rateLimit('first', NOW).allowed).toBe(false)
    expect(rateLimit('second', NOW).allowed).toBe(true)
  })

  it('opens again once the window has passed', () => {
    for (let i = 0; i < 6; i += 1) rateLimit('ip', NOW)
    expect(rateLimit('ip', NOW).allowed).toBe(false)

    const afterWindow = NOW + 10 * 60 * 1000
    expect(rateLimit('ip', afterWindow).allowed).toBe(true)
  })

  it('does not reset early, at the last millisecond of the window', () => {
    for (let i = 0; i < 6; i += 1) rateLimit('ip', NOW)
    const justBefore = NOW + 10 * 60 * 1000 - 1
    expect(rateLimit('ip', justBefore).allowed).toBe(false)
  })
})

describe('clientIp', () => {
  it('prefers the address Cloudflare saw over anything in x-forwarded-for', () => {
    // A visitor can pre-fill x-forwarded-for; Cloudflare appends to it rather
    // than replacing it. cf-connecting-ip is Cloudflare's own.
    const headers = new Headers({
      'cf-connecting-ip': '198.51.100.20',
      'x-forwarded-for': '203.0.113.7, 198.51.100.20, 172.70.0.1',
    })
    expect(clientIp(headers)).toBe('198.51.100.20')
  })

  it('accepts an IPv6 address from Cloudflare', () => {
    expect(clientIp(new Headers({ 'cf-connecting-ip': '2001:db8::1' }))).toBe('2001:db8::1')
  })

  it('ignores a cf-connecting-ip that is not an address, and falls back', () => {
    const headers = new Headers({
      'cf-connecting-ip': 'not an address, honestly',
      'x-forwarded-for': '203.0.113.7',
    })
    expect(clientIp(headers)).toBe('203.0.113.7')
  })

  it('takes the left-most entry of x-forwarded-for, which is the client', () => {
    // Everything after the first was appended by an intermediary. Reading the
    // last one instead would key the limit on Railway's proxy, which is the
    // same address for every visitor.
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1, 10.0.0.2' })
    expect(clientIp(headers)).toBe('203.0.113.7')
  })

  it('trims the whitespace the header conventionally carries', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '  203.0.113.7 , 10.0.0.1' }))).toBe(
      '203.0.113.7',
    )
  })

  it('falls back to x-real-ip', () => {
    expect(clientIp(new Headers({ 'x-real-ip': '203.0.113.9' }))).toBe('203.0.113.9')
  })

  it('reports unknown rather than throwing when there is no header at all', () => {
    expect(clientIp(new Headers())).toBe('unknown')
  })

  it('ignores an empty x-forwarded-for and moves on', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '', 'x-real-ip': '203.0.113.9' }))).toBe(
      '203.0.113.9',
    )
  })
})
