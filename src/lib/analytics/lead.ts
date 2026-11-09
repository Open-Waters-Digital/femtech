import { classifyChannel } from '@open-waters-digital/analytics/contract'
import {
  createServerCapture,
  parseAttribution,
  type ServerCapture,
  type ServerEvents,
} from '@open-waters-digital/analytics/server'

import { isIndexable } from '@/lib/site-env'

/**
 * The `lead_submitted` event for a new member: the number the network is
 * given, sent from the server because an ad blocker cannot remove it.
 *
 * It carries the form, the kind of lead and where the visit came from, and
 * nothing else from the sign-up: never a name, an email, a phone number, a job
 * title, an organisation or the industry chosen. The attribution the browser
 * sent is parsed by the package, which trusts none of it, and is never stored.
 */
export type LeadProperties = ServerEvents['lead_submitted']

export function leadProperties(input: { ow_attribution?: string | undefined }): LeadProperties {
  const attribution = parseAttribution(input.ow_attribution)
  return {
    form_id: 'signup',
    lead_type: 'membership',
    channel: classifyChannel(attribution),
    ...attribution,
  }
}

let capture: ServerCapture | null = null

/**
 * Sends the event, from the production instance only: a preview and a
 * developer's machine send nothing, by the same rule that closes them to search
 * engines. Never throws, and resolves within five seconds whatever PostHog
 * does, so it cannot fail or hold up the sign-up.
 */
export async function sendLead(properties: LeadProperties): Promise<void> {
  if (!isIndexable()) return
  capture ??= createServerCapture({
    site: 'femtech',
    key: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  })
  await capture('lead_submitted', properties)
}
