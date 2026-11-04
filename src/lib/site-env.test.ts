import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { isShowcaseAvailable } from '@/lib/site-env'

let saved: string | undefined
beforeEach(() => {
  saved = process.env.SITE_ENV
})
afterEach(() => {
  if (saved === undefined) delete process.env.SITE_ENV
  else process.env.SITE_ENV = saved
})

describe('isShowcaseAvailable', () => {
  it('is false in production and in a preview', () => {
    process.env.SITE_ENV = 'production'
    expect(isShowcaseAvailable()).toBe(false)
    process.env.SITE_ENV = 'preview'
    expect(isShowcaseAvailable()).toBe(false)
  })

  it('is true locally, where SITE_ENV is unset', () => {
    delete process.env.SITE_ENV
    expect(isShowcaseAvailable()).toBe(true)
  })
})
