import { describe, expect, it } from 'vitest'

import { slugify, validateOrganiserUrl, validateSlug } from '@/lib/events/slug'

describe('slugify', () => {
  it('makes an address from a title', () => {
    expect(slugify('Winter Speakeasy')).toBe('winter-speakeasy')
    expect(slugify('Revive ME Global Longevity & Health Tech Summit')).toBe(
      'revive-me-global-longevity-and-health-tech-summit',
    )
  })

  it('drops apostrophes and accents rather than splitting on them', () => {
    expect(slugify('Women’s Health Night')).toBe('womens-health-night')
    expect(slugify('Café Pitch Évening')).toBe('cafe-pitch-evening')
  })

  it('trims hyphens from either end and caps the length', () => {
    expect(slugify('  — Keynotes 2027! — ')).toBe('keynotes-2027')
    const long = slugify('a'.repeat(50) + ' ' + 'b'.repeat(50))
    expect(long.length).toBeLessThanOrEqual(80)
    expect(long.endsWith('-')).toBe(false)
  })
})

describe('validateSlug', () => {
  it('accepts a clean slug', () => {
    expect(validateSlug('winter-speakeasy')).toBe(true)
  })

  it('refuses the reserved withdraw route', () => {
    expect(validateSlug('withdraw')).toMatch(/used by the site itself/)
  })

  it('refuses an empty or malformed slug', () => {
    expect(validateSlug('')).not.toBe(true)
    expect(validateSlug(null)).not.toBe(true)
    expect(validateSlug('Winter Speakeasy')).not.toBe(true)
    expect(validateSlug('a--b')).not.toBe(true)
    expect(validateSlug('-a')).not.toBe(true)
  })
})

describe('validateOrganiserUrl', () => {
  it('accepts nothing, or an https address', () => {
    expect(validateOrganiserUrl(undefined)).toBe(true)
    expect(validateOrganiserUrl('')).toBe(true)
    expect(validateOrganiserUrl('https://servicenextmedical.wbresearch.com')).toBe(true)
  })

  it('refuses http, a bare host and anything else', () => {
    expect(validateOrganiserUrl('http://example.com')).not.toBe(true)
    expect(validateOrganiserUrl('example.com')).not.toBe(true)
    expect(validateOrganiserUrl('javascript:alert(1)')).not.toBe(true)
    expect(validateOrganiserUrl('https://localhost')).not.toBe(true)
  })
})
