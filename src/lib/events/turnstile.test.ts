import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { TURNSTILE_TEST_KEYS, turnstileConfig, verifyTurnstile } from '@/lib/events/turnstile'

const CONFIG = { siteKey: 'site', secret: 'secret' }

const answer =
  (body: unknown, status = 200): typeof fetch =>
  async () =>
    new Response(JSON.stringify(body), { status })

const KEYS = ['TURNSTILE_SITE_KEY', 'TURNSTILE_SECRET_KEY', 'SITE_ENV']
let saved: Record<string, string | undefined> = {}
beforeEach(() => {
  saved = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]))
  for (const key of KEYS) delete process.env[key]
})
afterEach(() => {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

describe('verifyTurnstile', () => {
  it('passes when Cloudflare says so, sending the secret, the token and the address', async () => {
    let sent: FormData | undefined
    const doFetch: typeof fetch = async (_url, init) => {
      sent = init?.body as FormData
      return new Response(JSON.stringify({ success: true }))
    }
    expect(await verifyTurnstile('token', '203.0.113.7', { fetch: doFetch, config: CONFIG })).toBe(
      'pass',
    )
    expect(sent?.get('secret')).toBe('secret')
    expect(sent?.get('response')).toBe('token')
    expect(sent?.get('remoteip')).toBe('203.0.113.7')
  })

  it('fails a token Cloudflare rejects', async () => {
    const result = await verifyTurnstile('token', 'ip', {
      fetch: answer({ success: false, 'error-codes': ['invalid-input-response'] }),
      config: CONFIG,
    })
    expect(result).toBe('fail')
  })

  it('fails a missing or absurd token without calling Cloudflare', async () => {
    const never: typeof fetch = async () => {
      throw new Error('should not be called')
    }
    expect(await verifyTurnstile('', 'ip', { fetch: never, config: CONFIG })).toBe('fail')
    expect(await verifyTurnstile(null, 'ip', { fetch: never, config: CONFIG })).toBe('fail')
    expect(await verifyTurnstile('x'.repeat(3000), 'ip', { fetch: never, config: CONFIG })).toBe(
      'fail',
    )
  })

  it('is unavailable when Cloudflare times out or cannot be reached', async () => {
    const timeout: typeof fetch = async () => {
      throw new DOMException('The operation timed out.', 'TimeoutError')
    }
    expect(await verifyTurnstile('token', 'ip', { fetch: timeout, config: CONFIG })).toBe(
      'unavailable',
    )
  })

  it('is unavailable on a non-200 answer or one it cannot read', async () => {
    expect(await verifyTurnstile('token', 'ip', { fetch: answer({}, 500), config: CONFIG })).toBe(
      'unavailable',
    )
    expect(
      await verifyTurnstile('token', 'ip', { fetch: answer({ nope: 1 }), config: CONFIG }),
    ).toBe('unavailable')
  })

  it('is unavailable without configuration, rather than letting everything through', async () => {
    expect(await verifyTurnstile('token', 'ip', { config: null })).toBe('unavailable')
  })
})

describe('turnstileConfig', () => {
  it('uses the configured keys', () => {
    process.env.TURNSTILE_SITE_KEY = 'site'
    process.env.TURNSTILE_SECRET_KEY = 'secret'
    expect(turnstileConfig()).toEqual({ siteKey: 'site', secret: 'secret' })
  })

  it('falls back to Cloudflare’s test keys in development only', () => {
    expect(turnstileConfig()).toEqual(TURNSTILE_TEST_KEYS)
  })

  it('has no configuration in production or a preview without a secret', () => {
    process.env.SITE_ENV = 'production'
    expect(turnstileConfig()).toBeNull()
    process.env.SITE_ENV = 'preview'
    process.env.TURNSTILE_SITE_KEY = 'site'
    expect(turnstileConfig()).toBeNull()
  })
})
