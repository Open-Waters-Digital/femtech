import type { Message } from '@/lib/email'
import { buildConfirmation } from '@/lib/events/confirm'
import { buildMessage } from '@/lib/signup/notify'
import { type WelcomeContent, buildWelcome } from '@/lib/signup/welcome'

/**
 * Sample emails for `/design-system`, built by the same functions that send the
 * real ones, so the showcase shows the layout exactly as it goes out. The copy
 * is placeholder: the real copy is in the admin.
 */

const FROM = 'FemTech Healthcare Network <website@example.com>'

const MEMBER = {
  id: 1,
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  phone: '',
  jobTitle: 'Chief Medical Officer',
  organisation: 'Analytical Health',
  industry: 'digital-health' as const,
  emailUpdates: true as const,
}

const WELCOME: WelcomeContent = {
  thanksHeading: 'Welcome to the network.',
  thanks:
    'A placeholder for the thank-you message, as set on the sign-up page. It runs a sentence or two.\n\nA second paragraph, to show the spacing between them.',
  benefitsHeading: 'What membership means',
  benefitsIntro: 'A placeholder introduction to the benefits:',
  benefits: [
    { title: 'A benefit', description: 'a line describing it, as it reads on the sign-up page' },
    {
      title: 'Another benefit',
      description:
        'a longer line, to show how an item wraps when it runs past the width of a phone',
    },
    { title: 'A third', description: 'short' },
  ],
  comingSoonHeading: 'Coming soon',
  comingSoonBody: 'A placeholder for the coming-soon paragraph.',
  linkedIn: 'https://www.linkedin.com/',
  replyTo: null,
}

export type ShowcaseEmail = { label: string; message: Message }

export function showcaseEmails(): ShowcaseEmail[] {
  return [
    {
      label: 'Welcome, with a LinkedIn profile set',
      message: buildWelcome(MEMBER, WELCOME, { from: FROM }),
    },
    {
      label: 'Welcome, no LinkedIn profile, no benefits or coming soon',
      message: buildWelcome(
        MEMBER,
        { ...WELCOME, linkedIn: null, benefits: [], comingSoonBody: null },
        { from: FROM },
      ),
    },
    {
      label: 'Team notification: a new sign-up',
      message: buildMessage(MEMBER, {
        from: FROM,
        to: ['team@example.com'],
        repeat: false,
        welcome: 'sent',
      }),
    },
    {
      label: 'RSVP confirmation',
      message: buildConfirmation(
        { id: 1, firstName: 'Ada', email: 'ada@example.com' },
        {
          title: 'Winter Speakeasy',
          slug: 'winter-speakeasy',
          startsAt: '2026-12-03T18:30:00.000Z',
          startsAt_tz: 'Europe/London',
          endsAt: '2026-12-03T21:30:00.000Z',
          venue: 'A members’ club',
          city: 'London',
        },
        { from: FROM },
      ),
    },
  ]
}
