import { EMAIL_COLOURS as C, SITE_NAME } from '@/lib/brand-constants'
import { escapeRun, plain, plainRun, safe } from '@/lib/email'
import { siteUrl } from '@/lib/site-env'

/**
 * The one layout every email the site sends is drawn in: an ink masthead with
 * the cream mark, a raised cream card with a serif heading, and a footer, on
 * the cream ground.
 *
 * Mail clients are not browsers. Gmail drops most of a <style> block, Outlook
 * desktop renders with Word, and nobody runs CSS variables or web fonts
 * reliably. So: tables for layout, every style inline, literal colours from
 * `EMAIL_COLOURS` (kept in step with tokens.css by a test), and font stacks
 * that fall back to Georgia and Helvetica. The one <style> rule only tightens
 * the padding on a phone; without it the email still fits.
 *
 * An email is a heading and a list of blocks. Each block renders its HTML and
 * its plain text from the same data, so the two parts cannot drift, and each
 * escapes what it is given, so no email can forget to.
 */

/** A run of text inside a paragraph or a list item. */
export type Inline = string | { strong: string } | { text: string; href: string }

export type Block =
  | { kind: 'paragraph'; parts: Inline[]; size?: 'lead' }
  | { kind: 'subheading'; text: string }
  | { kind: 'list'; items: Inline[][] }
  | { kind: 'table'; rows: [label: string, value: string][] }
  | { kind: 'button'; label: string; href: string }
  | { kind: 'divider' }
  | { kind: 'smallprint'; parts: Inline[] }

export type EmailContent = {
  /** The <title>, and the subject as the caller will send it. */
  subject: string
  /** The inbox preview line. Hidden in the body. */
  preheader?: string
  heading: string
  blocks: Block[]
  /** A line under the network's name in the footer, such as why they got it. */
  footerNote?: string
}

export type RenderedEmail = { html: string; text: string }

export const FONT_SERIF = "Georgia, 'Times New Roman', Times, serif"
export const FONT_SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif"

/** The PNG from Webflow is 58×61; shown at 40 wide it keeps that ratio. */
const MARK = { path: '/brand/femtech-mark.png', width: 40, height: 42 }

/**
 * Only web and mail links. Anything else (a `javascript:` URL an editor pasted,
 * say) is dropped and its text shown alone.
 */
export function isSafeHref(href: string): boolean {
  return /^(https?:\/\/|mailto:)/i.test(href.trim())
}

function inlineHtml(parts: Inline[]): string {
  return parts
    .map((part) => {
      if (typeof part === 'string') return escapeRun(part)
      if ('strong' in part) {
        return `<strong style="font-weight:600;color:${C.text};">${escapeRun(part.strong)}</strong>`
      }
      if (!isSafeHref(part.href)) return escapeRun(part.text)
      return `<a href="${safe(part.href)}" style="color:${C.text};text-decoration:underline;">${escapeRun(part.text)}</a>`
    })
    .join('')
    .trim()
}

function inlineText(parts: Inline[]): string {
  return parts
    .map((part) => {
      if (typeof part === 'string') return plainRun(part)
      if ('strong' in part) return plainRun(part.strong)
      if (!isSafeHref(part.href)) return plainRun(part.text)
      return `${plainRun(part.text)} (${plain(part.href)})`
    })
    .join('')
    .trim()
}

const BODY = `margin:0 0 20px;font-family:${FONT_SANS};font-size:16px;line-height:1.6;color:${C.muted};`

function blockHtml(block: Block): string {
  switch (block.kind) {
    case 'paragraph':
      return block.size === 'lead'
        ? `<p style="margin:0 0 20px;font-family:${FONT_SANS};font-size:18px;line-height:1.55;color:${C.text};">${inlineHtml(block.parts)}</p>`
        : `<p style="${BODY}">${inlineHtml(block.parts)}</p>`
    case 'subheading':
      return `<h2 style="margin:32px 0 12px;font-family:${FONT_SERIF};font-size:22px;line-height:1.25;font-weight:400;color:${C.text};">${safe(block.text)}</h2>`
    case 'list':
      return [
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">`,
        ...block.items.map(
          (item) =>
            `<tr><td valign="top" width="20" style="padding:2px 0 12px;font-family:${FONT_SANS};font-size:14px;line-height:1.6;color:${C.ornament};">&#10022;</td>` +
            `<td valign="top" style="padding:0 0 12px;font-family:${FONT_SANS};font-size:16px;line-height:1.6;color:${C.muted};">${inlineHtml(item)}</td></tr>`,
        ),
        '</table>',
      ].join('')
    case 'table':
      return [
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;border-top:1px solid ${C.line};">`,
        ...block.rows.map(
          ([label, value]) =>
            `<tr><td valign="top" width="38%" style="padding:10px 12px 10px 0;border-bottom:1px solid ${C.line};font-family:${FONT_SANS};font-size:14px;line-height:1.5;color:${C.subtle};">${safe(label)}</td>` +
            `<td valign="top" style="padding:10px 0;border-bottom:1px solid ${C.line};font-family:${FONT_SANS};font-size:15px;line-height:1.5;color:${C.text};">${safe(value)}</td></tr>`,
        ),
        '</table>',
      ].join('')
    case 'button':
      if (!isSafeHref(block.href)) return ''
      return (
        `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;"><tr>` +
        `<td style="background:${C.inverse};border-radius:6px;">` +
        `<a href="${safe(block.href)}" style="display:inline-block;padding:14px 28px;font-family:${FONT_SANS};font-size:16px;font-weight:600;line-height:1;color:${C.inverseText};text-decoration:none;border-radius:6px;">${safe(block.label)}&nbsp;&nbsp;<span style="color:${C.ornament};">&#10022;</span></a>` +
        `</td></tr></table>`
      )
    case 'divider':
      return (
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0;"><tr>` +
        `<td width="45%" valign="middle"><div style="height:1px;line-height:1px;font-size:1px;background:${C.line};">&nbsp;</div></td>` +
        `<td align="center" valign="middle" style="padding:0 12px;font-family:${FONT_SANS};font-size:16px;line-height:1;color:${C.ornament};">&#10022;</td>` +
        `<td width="45%" valign="middle"><div style="height:1px;line-height:1px;font-size:1px;background:${C.line};">&nbsp;</div></td>` +
        `</tr></table>`
      )
    case 'smallprint':
      return `<p style="margin:0 0 16px;font-family:${FONT_SANS};font-size:14px;line-height:1.55;color:${C.subtle};">${inlineHtml(block.parts)}</p>`
  }
}

function blockText(block: Block): string {
  switch (block.kind) {
    case 'paragraph':
    case 'smallprint':
      return inlineText(block.parts)
    case 'subheading':
      return plain(block.text)
    case 'list':
      return block.items.map((item) => `* ${inlineText(item)}`).join('\n')
    case 'table':
      return block.rows.map(([label, value]) => `${plain(label)}: ${plain(value)}`).join('\n')
    case 'button':
      return isSafeHref(block.href) ? `${plain(block.label)}: ${plain(block.href)}` : ''
    case 'divider':
      return '* * *'
  }
}

export function renderEmail(content: EmailContent): RenderedEmail {
  const site = siteUrl()
  const host = site.replace(/^https?:\/\//, '')
  const mark = `${site}${MARK.path}`

  const preheader = content.preheader
    ? `<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;">${safe(content.preheader)}</div>`
    : ''

  const html = [
    '<!doctype html>',
    '<html lang="en-GB">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="color-scheme" content="light">',
    '<meta name="supported-color-schemes" content="light">',
    `<title>${safe(content.subject)}</title>`,
    '<style>@media (max-width:620px){.fh-card{padding:28px 20px !important}.fh-h1{font-size:26px !important}}</style>',
    '</head>',
    `<body style="margin:0;padding:0;background:${C.surface};-webkit-text-size-adjust:100%;">`,
    preheader,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.surface};">`,
    '<tr><td align="center" style="padding:32px 12px 40px;">',
    // Outlook desktop ignores max-width; a fixed-width table there instead.
    '<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">',
    // The masthead: the cream mark and wordmark on ink, as over the home
    // page's hero. The mark is cream on transparent, made for a dark ground,
    // so it cannot sit on the cream. With images blocked, its alt text shows
    // in cream on the same ink.
    `<tr><td align="center" style="background:${C.inverse};border-radius:8px 8px 0 0;padding:28px 24px 24px;">`,
    `<a href="${safe(site)}" style="text-decoration:none;color:${C.inverseText};">`,
    `<img src="${safe(mark)}" width="${MARK.width}" height="${MARK.height}" alt="${safe(SITE_NAME)}" style="display:block;margin:0 auto 10px;border:0;outline:none;color:${C.inverseText};font-family:${FONT_SANS};font-size:14px;">`,
    `<span style="font-family:${FONT_SERIF};font-size:24px;line-height:1;letter-spacing:-0.02em;color:${C.inverseText};">femtech</span>`,
    '</a>',
    '</td></tr>',
    // The card, joined to the masthead.
    `<tr><td class="fh-card" style="background:${C.raised};border-radius:0 0 8px 8px;padding:40px 40px 24px;">`,
    `<h1 class="fh-h1" style="margin:0 0 24px;font-family:${FONT_SERIF};font-size:30px;line-height:1.15;font-weight:400;letter-spacing:-0.01em;color:${C.text};">${safe(content.heading)}</h1>`,
    ...content.blocks.map(blockHtml),
    '</td></tr>',
    // The footer.
    `<tr><td align="center" style="padding:24px 16px 0;font-family:${FONT_SANS};font-size:13px;line-height:1.6;color:${C.subtle};">`,
    `<p style="margin:0 0 4px;">${safe(SITE_NAME)}</p>`,
    `<p style="margin:0;"><a href="${safe(site)}" style="color:${C.subtle};text-decoration:underline;">${safe(host)}</a></p>`,
    content.footerNote ? `<p style="margin:12px 0 0;">${safe(content.footerNote)}</p>` : '',
    '</td></tr>',
    '</table>',
    '<!--[if mso]></td></tr></table><![endif]-->',
    '</td></tr>',
    '</table>',
    '</body>',
    '</html>',
  ].join('')

  const text = [
    plain(content.heading),
    '',
    ...content.blocks
      .map(blockText)
      .filter(Boolean)
      .flatMap((part) => [part, '']),
    '--',
    SITE_NAME,
    site,
    ...(content.footerNote ? ['', plain(content.footerNote)] : []),
  ].join('\n')

  return { html, text }
}
