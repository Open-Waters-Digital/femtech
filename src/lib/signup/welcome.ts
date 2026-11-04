import {
  type Message,
  type NotifyResult,
  type Send,
  plain,
  resendSender,
  sendWithTimeout,
} from '@/lib/email'
import { type Block, renderEmail } from '@/lib/email-layout'
import { SITE_NAME } from '@/lib/brand-constants'
import { isIndexable, siteUrl } from '@/lib/site-env'
import { linkedInUrl } from '@/lib/social'
import { paragraphs } from '@/lib/text'
import type { SiteSetting } from '@/payload-types'

/**
 * The email that welcomes a new member: what the network is, what membership
 * gives them, what comes next.
 *
 * Its copy is the sign-up page's own, from Site settings → Sign-up page, so an
 * editor who changes the page changes the email, and the two cannot say
 * different things. A section the editor has emptied is left out, as on the
 * page.
 *
 * It goes to the address someone typed, which is why /join sends it only for
 * a new member whose Turnstile check passed: otherwise anyone could use the
 * form to send our mail to strangers. The member is saved before this runs,
 * so a failed send loses nobody.
 */

const TIMEOUT_MS = 10_000

export type WelcomeOutcome = NotifyResult | 'unverified'

export type WelcomeMember = { firstName: string; email: string }

export type WelcomeContent = {
  thanksHeading: string
  thanks: string
  benefitsHeading: string
  benefitsIntro: string | null
  benefits: { title: string; description: string }[]
  comingSoonHeading: string
  comingSoonBody: string | null
  linkedIn: string | null
  replyTo: string | null
}

/** The slice of site settings the welcome reads, with the page's own defaults. */
export function welcomeContent(settings: SiteSetting): WelcomeContent {
  return {
    thanksHeading: settings.signupThanksHeading || `Welcome to ${SITE_NAME}.`,
    thanks: settings.signupThanks,
    benefitsHeading: settings.signupBenefitsHeading || 'What membership means',
    benefitsIntro: settings.signupBenefitsIntro || null,
    benefits: (settings.signupBenefits ?? []).map(({ title, description }) => ({
      title,
      description,
    })),
    comingSoonHeading: settings.signupComingSoonHeading || 'Coming soon',
    comingSoonBody: settings.signupComingSoonBody || null,
    linkedIn: linkedInUrl(settings.social),
    replyTo: settings.contactEmail || null,
  }
}

/** "Welcome to FemTech Healthcare Network." reads as a subject without its full stop. */
export function welcomeSubject(heading: string): string {
  const subject = plain(heading)
    .replace(/[.!]+$/, '')
    .trim()
  return subject || `Welcome to ${SITE_NAME}`
}

export function buildWelcome(
  member: WelcomeMember,
  content: WelcomeContent,
  options: { from: string },
): Message {
  const subject = welcomeSubject(content.thanksHeading)
  const site = siteUrl()

  const blocks: Block[] = [
    { kind: 'paragraph', parts: [`Hello ${member.firstName},`] },
    ...paragraphs(content.thanks).map((text, index): Block => ({
      kind: 'paragraph',
      parts: [text],
      ...(index === 0 ? { size: 'lead' as const } : {}),
    })),
  ]

  if (content.benefits.length > 0) {
    blocks.push({ kind: 'divider' }, { kind: 'subheading', text: content.benefitsHeading })
    for (const text of paragraphs(content.benefitsIntro)) {
      blocks.push({ kind: 'paragraph', parts: [text] })
    }
    blocks.push({
      kind: 'list',
      items: content.benefits.map(({ title, description }) => [
        { strong: `${title}:` },
        ` ${description}`,
      ]),
    })
  }

  const comingSoon = paragraphs(content.comingSoonBody)
  if (comingSoon.length > 0) {
    blocks.push({ kind: 'subheading', text: content.comingSoonHeading })
    for (const text of comingSoon) blocks.push({ kind: 'paragraph', parts: [text] })
  }

  blocks.push({ kind: 'button', label: 'Visit femtechhealth.com', href: site })

  if (content.linkedIn) {
    blocks.push({
      kind: 'paragraph',
      parts: [
        'In the meantime, follow us on ',
        { text: 'LinkedIn', href: content.linkedIn },
        ' to stay connected.',
      ],
    })
  }

  const { html, text } = renderEmail({
    subject,
    preheader: paragraphs(content.thanks)[0] ?? subject,
    heading: plain(content.thanksHeading),
    blocks,
    footerNote: `You’re receiving this because you signed up at ${site.replace(/^https?:\/\//, '')}.`,
  })

  return {
    from: options.from,
    to: [member.email],
    ...(content.replyTo ? { replyTo: content.replyTo } : {}),
    subject,
    html,
    text,
  }
}

/**
 * Email the new member. `send` is a seam for tests; without it, Resend is used
 * when the API key and the sending address are set.
 */
export async function sendWelcome(
  member: WelcomeMember,
  content: WelcomeContent,
  send?: Send,
): Promise<NotifyResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.SIGNUP_FROM_EMAIL ?? ''

  const sender = send ?? (apiKey && from ? resendSender(apiKey) : null)
  if (!sender) return isIndexable() ? 'unconfigured' : 'skipped'

  return sendWithTimeout(sender, buildWelcome(member, content, { from }), TIMEOUT_MS)
}
