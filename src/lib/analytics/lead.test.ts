import { afterEach, describe, expect, it, vi } from 'vitest'

import { leadProperties } from '@/lib/analytics/lead'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
  vi.doUnmock('@open-waters-digital/analytics/server')
})

describe('leadProperties', () => {
  it('is a membership sign-up from organic search for a search-engine visit', () => {
    const attribution = JSON.stringify({ referring_domain: 'www.google.com' })
    expect(leadProperties({ ow_attribution: attribution })).toEqual({
      form_id: 'signup',
      lead_type: 'membership',
      channel: 'organic_search',
      referring_domain: 'www.google.com',
    })
  })

  it('carries a campaign’s attribution', () => {
    const attribution = JSON.stringify({
      utm_source: 'linkedin',
      utm_medium: 'social',
      utm_campaign: 'launch',
    })
    expect(leadProperties({ ow_attribution: attribution })).toMatchObject({
      channel: 'organic_social',
      utm_source: 'linkedin',
      utm_campaign: 'launch',
    })
  })

  it.each([
    ['absent, as from a no-script post', undefined],
    ['empty', ''],
    ['malformed', '{not json'],
    ['not an object', '[1,2]'],
  ])('is unknown when the attribution is %s', (_label, value) => {
    expect(leadProperties({ ow_attribution: value })).toEqual({
      form_id: 'signup',
      lead_type: 'membership',
      channel: 'unknown',
    })
  })

  it('drops an email address someone put in a UTM value', () => {
    const attribution = JSON.stringify({
      utm_source: 'newsletter',
      utm_campaign: 'ada@example.com',
    })
    expect(JSON.stringify(leadProperties({ ow_attribution: attribution }))).not.toContain(
      'ada@example.com',
    )
  })

  it('computes the channel, ignoring one the browser forged', () => {
    const attribution = JSON.stringify({ channel: 'paid_social' })
    expect(leadProperties({ ow_attribution: attribution }).channel).toBe('direct')
  })
})

describe('sendLead', () => {
  async function load(siteEnv: string) {
    const capture = vi.fn(async () => undefined)
    const createServerCapture = vi.fn(() => capture)
    vi.doMock('@open-waters-digital/analytics/server', async (importOriginal) => ({
      ...(await importOriginal<typeof import('@open-waters-digital/analytics/server')>()),
      createServerCapture,
    }))
    vi.stubEnv('SITE_ENV', siteEnv)
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'phc_test')
    const { sendLead } = await import('@/lib/analytics/lead')
    return { sendLead, capture, createServerCapture }
  }

  const PROPERTIES = { form_id: 'signup', lead_type: 'membership', channel: 'direct' } as const

  it('captures from production, as femtech, creating the client once', async () => {
    const { sendLead, capture, createServerCapture } = await load('production')
    await sendLead(PROPERTIES)
    await sendLead(PROPERTIES)
    expect(createServerCapture).toHaveBeenCalledTimes(1)
    expect(createServerCapture).toHaveBeenCalledWith({ site: 'femtech', key: 'phc_test' })
    expect(capture).toHaveBeenCalledWith('lead_submitted', PROPERTIES)
  })

  it.each(['preview', 'development'])('sends nothing from %s', async (siteEnv) => {
    const { sendLead, capture } = await load(siteEnv)
    await sendLead(PROPERTIES)
    expect(capture).not.toHaveBeenCalled()
  })
})
