import { describe, expect, it } from 'vitest'

import {
  STATIC_SECURITY_HEADERS,
  TURNSTILE_ORIGIN,
  contentSecurityPolicy,
  createNonce,
} from '@/lib/security-headers'

const directive = (policy: string, name: string) =>
  policy
    .split('; ')
    .find((entry) => entry === name || entry.startsWith(`${name} `))
    ?.split(' ')
    .slice(1)

const PRODUCTION = { nonce: 'abc123', development: false, https: true }

describe('contentSecurityPolicy', () => {
  it('admits scripts by nonce only, never inline or eval, in a build', () => {
    const scripts = directive(contentSecurityPolicy(PRODUCTION), 'script-src')
    expect(scripts).toContain("'nonce-abc123'")
    expect(scripts).toContain("'strict-dynamic'")
    expect(scripts).not.toContain("'unsafe-inline'")
    expect(scripts).not.toContain("'unsafe-eval'")
  })

  it('lets Turnstile load its script and draw its iframe', () => {
    const policy = contentSecurityPolicy(PRODUCTION)
    expect(directive(policy, 'script-src')).toContain(TURNSTILE_ORIGIN)
    expect(directive(policy, 'frame-src')).toEqual([TURNSTILE_ORIGIN])
    expect(TURNSTILE_ORIGIN).toBe('https://challenges.cloudflare.com')
  })

  it('allows eval in development only, where React needs it', () => {
    const scripts = directive(
      contentSecurityPolicy({ ...PRODUCTION, development: true }),
      'script-src',
    )
    expect(scripts).toContain("'unsafe-eval'")
  })

  it('upgrades http subresources only when served over https', () => {
    expect(contentSecurityPolicy(PRODUCTION)).toContain('upgrade-insecure-requests')
    expect(contentSecurityPolicy({ ...PRODUCTION, https: false })).not.toContain(
      'upgrade-insecure-requests',
    )
  })

  it('shuts the usual doors', () => {
    const policy = contentSecurityPolicy(PRODUCTION)
    expect(directive(policy, 'object-src')).toEqual(["'none'"])
    expect(directive(policy, 'base-uri')).toEqual(["'self'"])
    expect(directive(policy, 'form-action')).toEqual(["'self'"])
    expect(directive(policy, 'frame-ancestors')).toEqual(["'self'"])
    expect(directive(policy, 'default-src')).toEqual(["'self'"])
  })

  it('is one line, as a header must be', () => {
    expect(contentSecurityPolicy(PRODUCTION)).not.toMatch(/[\r\n]/)
  })
})

describe('createNonce', () => {
  it('is different every time and safe inside the header', () => {
    const nonces = new Set(Array.from({ length: 50 }, createNonce))
    expect(nonces.size).toBe(50)
    for (const nonce of nonces) expect(nonce).toMatch(/^[A-Za-z0-9+/=]{24,}$/)
  })
})

describe('STATIC_SECURITY_HEADERS', () => {
  it('sets HSTS without promising https for every subdomain', () => {
    const hsts = STATIC_SECURITY_HEADERS.find(
      (header) => header.key === 'Strict-Transport-Security',
    )
    expect(hsts?.value).toBe('max-age=31536000')
  })

  it('stops MIME sniffing', () => {
    expect(STATIC_SECURITY_HEADERS).toContainEqual({
      key: 'X-Content-Type-Options',
      value: 'nosniff',
    })
  })
})
