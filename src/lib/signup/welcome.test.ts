import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Message } from '@/lib/email'
import {
  type WelcomeContent,
  buildWelcome,
  sendWelcome,
  welcomeContent,
  welcomeSubject,
} from '@/lib/signup/welcome'
import type { SiteSetting } from '@/payload-types'

/** The client's copy, as seeded (scripts/seed.ts). */
const SETTINGS: SiteSetting = {
  id: 1,
  footerHeading: 'x',
  footerCtaLabel: 'x',
  copyrightHolder: 'x',
  contactEmail: null,
  signupTitle: 'Become a Member. It’s free.',
  signupBenefitsHeading: 'What membership means',
  signupBenefitsIntro:
    'Membership is free and gives you first access to everything we’re building:',
  signupBenefits: [
    {
      title: 'Curated events',
      description: 'intimate gatherings designed for meaningful connections, not crowded rooms',
    },
    {
      title: 'Speakeasies',
      description:
        'relaxed, invitation-style evenings to meet peers, share ideas and build your network',
    },
    {
      title: 'Keynotes',
      description: 'insight and inspiration from leaders transforming healthcare and technology',
    },
    {
      title: 'Investment pitches',
      description:
        'spaces where women founders and innovators can meet investors and pitch for the backing to scale',
    },
    {
      title: 'Member spaces',
      description: 'new platforms to connect, collaborate and grow, launching soon',
    },
  ],
  signupComingSoonHeading: 'Coming soon',
  signupComingSoonBody:
    'Our full events schedule launches on our Events page in December 2026, along with new products and member offerings. Sign up now and you’ll be the first to hear when it goes live.',
  signupThanksHeading: 'Welcome to FemTech Healthcare Network.',
  signupThanks:
    'You’re officially a member. Keep an eye on your inbox: our events schedule, investment pitch opportunities and new member offerings launch in December 2026, and you’ll be the first to know.',
  social: [
    {
      platform: 'linkedin',
      href: 'https://www.linkedin.com/company/femtech-healthcare-network/',
    },
  ],
}

const MEMBER = { firstName: 'Ada', email: 'ada@example.com' }
const CONTENT = welcomeContent(SETTINGS)
const build = (content: WelcomeContent = CONTENT, member = MEMBER) =>
  buildWelcome(member, content, { from: 'f' })

const KEYS = ['RESEND_API_KEY', 'SIGNUP_FROM_EMAIL', 'SITE_ENV', 'NEXT_PUBLIC_SITE_URL']
let saved: Record<string, string | undefined> = {}
beforeEach(() => {
  saved = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]))
  process.env.SIGNUP_FROM_EMAIL = 'FemTech Healthcare Network <website@example.com>'
  process.env.NEXT_PUBLIC_SITE_URL = 'https://www.femtechhealth.com'
  delete process.env.RESEND_API_KEY
  delete process.env.SITE_ENV
})
afterEach(() => {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  vi.useRealTimers()
})

describe('buildWelcome with the seeded copy', () => {
  it('goes to the member alone, with the heading as its subject', () => {
    const message = build()
    expect(message.to).toEqual(['ada@example.com'])
    expect(message.subject).toBe('Welcome to FemTech Healthcare Network')
  })

  it('greets them by first name, then the thank-you message', () => {
    const { text, html } = build()
    expect(text).toMatch(
      /^Welcome to FemTech Healthcare Network\.\n\nHello Ada,\n\nYou’re officially a member\./,
    )
    expect(html).toContain('Hello Ada,')
  })

  it('says what membership means, with all five benefits', () => {
    const { text, html } = build()
    expect(text).toContain('What membership means')
    expect(text).toContain('Membership is free and gives you first access')
    for (const title of [
      'Curated events',
      'Speakeasies',
      'Keynotes',
      'Investment pitches',
      'Member spaces',
    ]) {
      expect(text).toContain(`* ${title}: `)
      expect(html).toContain(`${title}:</strong>`)
    }
  })

  it('gives the coming-soon paragraph and links to the site', () => {
    const { text, html } = build()
    expect(text).toContain('Coming soon\n\nOur full events schedule launches')
    expect(text).toContain('Visit femtechhealth.com: https://www.femtechhealth.com')
    expect(html).toContain('href="https://www.femtechhealth.com"')
  })

  it('invites them to follow on LinkedIn when a profile is set', () => {
    const { text, html } = build()
    expect(text).toContain(
      'In the meantime, follow us on LinkedIn (https://www.linkedin.com/company/femtech-healthcare-network/) to stay connected.',
    )
    expect(html).toContain('href="https://www.linkedin.com/company/femtech-healthcare-network/"')
  })

  it('has no LinkedIn line without a profile', () => {
    const { text } = build({ ...CONTENT, linkedIn: null })
    expect(text).not.toContain('LinkedIn')
  })

  it('says why they received it', () => {
    expect(build().text).toContain(
      'You’re receiving this because you signed up at www.femtechhealth.com.',
    )
  })
})

describe('buildWelcome when an editor empties a section', () => {
  it('leaves out the benefits and their heading', () => {
    const { text } = build({ ...CONTENT, benefits: [] })
    expect(text).not.toContain('What membership means')
    expect(text).not.toContain('Membership is free')
  })

  it('leaves out coming soon and its heading', () => {
    const { text } = build({ ...CONTENT, comingSoonBody: null })
    expect(text).not.toContain('Coming soon')
  })

  it('carries an edited benefit', () => {
    const content = welcomeContent({
      ...SETTINGS,
      signupBenefits: [{ title: 'Salons', description: 'small evenings' }],
    })
    expect(build(content).text).toContain('* Salons: small evenings')
  })

  it('splits the thank-you message into paragraphs on blank lines', () => {
    const { text } = build({ ...CONTENT, thanks: 'One.\n\nTwo.' })
    expect(text).toContain('One.\n\nTwo.')
  })
})

describe('buildWelcome is safe with what people type', () => {
  it('shows markup in a first name or in editor copy as text', () => {
    const { html } = build(
      {
        ...CONTENT,
        thanks: '<script>x</script>',
        benefits: [{ title: '<b>', description: '<i>' }],
      },
      { ...MEMBER, firstName: '<img src=x onerror=alert(1)>' },
    )
    expect(html).not.toContain('<script>x')
    expect(html).not.toContain('<img src=x')
    expect(html).not.toContain('<b>:')
    expect(html).toContain('&lt;script&gt;')
  })

  it('keeps a line break in the heading out of the subject', () => {
    expect(build({ ...CONTENT, thanksHeading: 'Hi\r\nBcc: x@example.com' }).subject).not.toMatch(
      /[\r\n]/,
    )
  })

  it('drops a LinkedIn link that is not a web address', () => {
    const { html } = build({ ...CONTENT, linkedIn: 'javascript:alert(1)' })
    expect(html).not.toContain('javascript:')
  })
})

describe('welcomeSubject and welcomeContent', () => {
  it('drops a closing full stop, and falls back when the heading is empty', () => {
    expect(welcomeSubject('Welcome to FemTech Healthcare Network.')).toBe(
      'Welcome to FemTech Healthcare Network',
    )
    expect(welcomeSubject('')).toBe('Welcome to FemTech Healthcare Network')
  })

  it('replies to the contact email only when one is set', () => {
    expect(build()).not.toHaveProperty('replyTo')
    const content = welcomeContent({ ...SETTINGS, contactEmail: 'hello@example.com' })
    expect(build(content).replyTo).toBe('hello@example.com')
  })
})

describe('sendWelcome', () => {
  it('sends from the configured address and reports sent', async () => {
    const sent: Message[] = []
    const result = await sendWelcome(MEMBER, CONTENT, async (message) => {
      sent.push(message)
      return { error: null }
    })
    expect(result).toBe('sent')
    expect(sent[0]?.from).toBe('FemTech Healthcare Network <website@example.com>')
  })

  it('reports failed when the provider refuses or throws', async () => {
    expect(await sendWelcome(MEMBER, CONTENT, async () => ({ error: 'nope' }))).toBe('failed')
    expect(
      await sendWelcome(MEMBER, CONTENT, async () => {
        throw new Error('down')
      }),
    ).toBe('failed')
  })

  it('gives up after ten seconds rather than hanging', async () => {
    vi.useFakeTimers()
    const pending = sendWelcome(MEMBER, CONTENT, () => new Promise(() => {}))
    await vi.advanceTimersByTimeAsync(10_000)
    expect(await pending).toBe('failed')
  })

  it('skips in development and is unconfigured in production without mail settings', async () => {
    expect(await sendWelcome(MEMBER, CONTENT)).toBe('skipped')
    process.env.SITE_ENV = 'production'
    expect(await sendWelcome(MEMBER, CONTENT)).toBe('unconfigured')
  })
})
