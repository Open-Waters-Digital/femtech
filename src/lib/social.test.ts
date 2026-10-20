import { describe, expect, it } from 'vitest'

import { isPlatformUrl, linkedInUrl, platformUrlMessage } from '@/lib/social'

describe('isPlatformUrl', () => {
  it('accepts the platform host, with or without a subdomain', () => {
    expect(isPlatformUrl('linkedin', 'https://www.linkedin.com/company/femtech')).toBe(true)
    expect(isPlatformUrl('linkedin', 'https://linkedin.com/company/femtech')).toBe(true)
    expect(isPlatformUrl('linkedin', 'https://uk.linkedin.com/company/femtech')).toBe(true)
    expect(isPlatformUrl('instagram', 'https://www.instagram.com/femtech')).toBe(true)
    expect(isPlatformUrl('facebook', 'https://www.facebook.com/femtech')).toBe(true)
  })

  it('accepts twitter.com as well as x.com for X', () => {
    expect(isPlatformUrl('x', 'https://x.com/femtech')).toBe(true)
    expect(isPlatformUrl('x', 'https://twitter.com/femtech')).toBe(true)
  })

  it('refuses another platform’s host', () => {
    expect(isPlatformUrl('linkedin', 'https://www.instagram.com/femtech')).toBe(false)
    expect(isPlatformUrl('linkedin', 'https://example.com/femtech')).toBe(false)
  })

  it('refuses a host that only starts or ends like the platform', () => {
    expect(isPlatformUrl('linkedin', 'https://linkedin.com.example.com/')).toBe(false)
    expect(isPlatformUrl('linkedin', 'https://notlinkedin.com/')).toBe(false)
  })

  it('refuses http and anything that is not a URL', () => {
    expect(isPlatformUrl('linkedin', 'http://www.linkedin.com/company/femtech')).toBe(false)
    expect(isPlatformUrl('linkedin', 'www.linkedin.com/company/femtech')).toBe(false)
    expect(isPlatformUrl('linkedin', 'javascript:alert(1)')).toBe(false)
    expect(isPlatformUrl('linkedin', '')).toBe(false)
  })

  it('says what is expected', () => {
    expect(platformUrlMessage('x')).toBe(
      'Use the full X address, starting https:// on x.com or twitter.com.',
    )
  })
})

describe('linkedInUrl', () => {
  it('returns the first LinkedIn profile', () => {
    expect(
      linkedInUrl([
        { platform: 'instagram', href: 'https://instagram.com/a' },
        { platform: 'linkedin', href: 'https://linkedin.com/company/a' },
        { platform: 'linkedin', href: 'https://linkedin.com/company/b' },
      ]),
    ).toBe('https://linkedin.com/company/a')
  })

  it('returns null without one', () => {
    expect(linkedInUrl([{ platform: 'x', href: 'https://x.com/a' }])).toBeNull()
    expect(linkedInUrl(null)).toBeNull()
    expect(linkedInUrl(undefined)).toBeNull()
  })
})
