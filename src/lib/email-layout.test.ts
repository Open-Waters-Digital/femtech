import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { type Block, isSafeHref, renderEmail } from '@/lib/email-layout'

const HOSTILE = '<script>alert(1)</script>'

let savedUrl: string | undefined
beforeEach(() => {
  savedUrl = process.env.NEXT_PUBLIC_SITE_URL
  process.env.NEXT_PUBLIC_SITE_URL = 'https://www.femtechhealth.com'
})
afterEach(() => {
  if (savedUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL
  else process.env.NEXT_PUBLIC_SITE_URL = savedUrl
})

const render = (blocks: Block[], extra: { preheader?: string; footerNote?: string } = {}) =>
  renderEmail({ subject: 'Subject', heading: 'Heading', blocks, ...extra })

describe('renderEmail: the frame', () => {
  it('draws the mark from the site, linked to it, with the network as alt text', () => {
    const { html } = render([])
    expect(html).toContain('src="https://www.femtechhealth.com/brand/femtech-mark.png"')
    expect(html).toContain('alt="FemTech Healthcare Network"')
    expect(html).toContain('href="https://www.femtechhealth.com"')
  })

  it('is a light-only, table-laid document with no script and no external stylesheet', () => {
    const { html } = render([{ kind: 'paragraph', parts: ['Hello'] }])
    expect(html.startsWith('<!doctype html>')).toBe(true)
    expect(html).toContain('<meta name="color-scheme" content="light">')
    expect(html).toContain('role="presentation"')
    expect(html).not.toMatch(/<script|<link/i)
  })

  it('falls back to Georgia for headings and Helvetica for body text', () => {
    const { html } = render([{ kind: 'paragraph', parts: ['Hello'] }])
    expect(html).toContain('Georgia')
    expect(html).toContain('Helvetica')
    expect(html).not.toMatch(/Zodiak|Cabinet/)
  })

  it('has a footer with the network and the site, and an optional note', () => {
    const plainFooter = render([])
    expect(plainFooter.html).toContain('>www.femtechhealth.com</a>')
    expect(plainFooter.text).toContain('FemTech Healthcare Network\nhttps://www.femtechhealth.com')

    const withNote = render([], { footerNote: 'You signed up.' })
    expect(withNote.html).toContain('You signed up.')
    expect(withNote.text).toContain('You signed up.')
  })

  it('hides the preheader in the body and escapes it', () => {
    const { html } = render([], { preheader: `Hi ${HOSTILE}` })
    expect(html).toContain('display:none')
    expect(html).toContain('Hi &lt;script&gt;')
    expect(html).not.toContain(HOSTILE)
  })

  it('escapes the heading and keeps the title on one line', () => {
    const { html } = renderEmail({
      subject: 'One\r\ntwo',
      heading: HOSTILE,
      blocks: [],
    })
    expect(html).toContain('<title>One two</title>')
    expect(html).not.toContain(HOSTILE)
  })
})

describe('renderEmail: every block escapes what it is given', () => {
  const cases: [string, Block][] = [
    ['paragraph', { kind: 'paragraph', parts: [HOSTILE] }],
    ['lead paragraph', { kind: 'paragraph', parts: [HOSTILE], size: 'lead' }],
    ['strong', { kind: 'paragraph', parts: [{ strong: HOSTILE }] }],
    ['link text', { kind: 'paragraph', parts: [{ text: HOSTILE, href: 'https://x.test' }] }],
    ['subheading', { kind: 'subheading', text: HOSTILE }],
    ['list', { kind: 'list', items: [[HOSTILE]] }],
    ['table label and value', { kind: 'table', rows: [[HOSTILE, HOSTILE]] }],
    ['button label', { kind: 'button', label: HOSTILE, href: 'https://x.test' }],
    ['smallprint', { kind: 'smallprint', parts: [HOSTILE] }],
  ]

  it.each(cases)('%s', (_name, block) => {
    const { html, text } = render([block])
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(text).toContain('<script>alert(1)</script>')
  })

  it('a quote in a link cannot leave the href attribute', () => {
    const { html } = render([
      { kind: 'button', label: 'Go', href: 'https://x.test/"onmouseover="alert(1)' },
    ])
    expect(html).toContain('href="https://x.test/&quot;onmouseover=&quot;alert(1)"')
    expect(html).not.toContain('" onmouseover')
  })

  it('drops a link that is not web or mail, keeping its text', () => {
    const { html, text } = render([
      { kind: 'paragraph', parts: [{ text: 'Click', href: 'javascript:alert(1)' }] },
      { kind: 'button', label: 'Go', href: 'javascript:alert(1)' },
    ])
    expect(html).not.toContain('javascript:')
    expect(html).toContain('Click')
    expect(text).not.toContain('javascript:')
  })
})

describe('renderEmail: the plain-text part', () => {
  it('carries every block, with links written out', () => {
    const { text } = render([
      { kind: 'paragraph', parts: ['Follow us on ', { text: 'LinkedIn', href: 'https://l.test' }] },
      { kind: 'subheading', text: 'What membership means' },
      { kind: 'list', items: [[{ strong: 'Keynotes:' }, ' insight']] },
      { kind: 'table', rows: [['Name', 'Ada']] },
      { kind: 'button', label: 'Visit the site', href: 'https://www.femtechhealth.com' },
      { kind: 'divider' },
    ])
    expect(text).toContain('Heading')
    expect(text).toContain('Follow us on LinkedIn (https://l.test)')
    expect(text).toContain('What membership means')
    expect(text).toContain('* Keynotes: insight')
    expect(text).toContain('Name: Ada')
    expect(text).toContain('Visit the site: https://www.femtechhealth.com')
    expect(text).not.toMatch(/<[a-z]/i)
  })
})

describe('isSafeHref', () => {
  it('allows web and mail links only', () => {
    expect(isSafeHref('https://a.test')).toBe(true)
    expect(isSafeHref('http://localhost:3000')).toBe(true)
    expect(isSafeHref('mailto:a@b.test')).toBe(true)
    expect(isSafeHref('javascript:alert(1)')).toBe(false)
    expect(isSafeHref('data:text/html,x')).toBe(false)
    expect(isSafeHref('/relative')).toBe(false)
  })
})
