/**
 * Brand values for places that cannot read a CSS variable: the theme-color meta
 * tag and the head's text. The no-hex lint rule exempts this file and only this
 * file; keep the colours in step with tokens.css.
 */
export const SITE_NAME = 'FemTech Healthcare Network'

export const SITE_DESCRIPTION =
  'A global community for women shaping the future of healthcare technology: clinicians, founders, executives, innovators, investors and rising talent.'

/** --color-surface. The browser chrome on mobile matches the page. */
export const THEME_COLOR = '#efe5d7'

/**
 * The palette for email, which cannot read CSS variables: mail clients take
 * inline styles and literal colours only. Each value mirrors the token named
 * beside it, and `brand-constants.test.ts` fails if one drifts from
 * tokens.css.
 */
export const EMAIL_COLOURS = {
  /** --color-surface: the ground of the whole email. */
  surface: '#efe5d7',
  /** --color-surface-raised: the card the content sits on. */
  raised: '#f7f1e8',
  /** --color-text */
  text: '#171411',
  /** --color-text-muted: body copy. 7.55:1 on surface. */
  muted: '#4d453c',
  /** --color-text-subtle: the footer and small print. */
  subtle: '#665c50',
  /** --color-line: hairlines. */
  line: '#c9bfb1',
  /** --color-ornament: the sparkle. */
  ornament: '#d1c5af',
  /** --color-surface-inverse: the masthead and the button's ground. */
  inverse: '#171411',
  /** --color-text-inverse: the mark's alt text, the wordmark and the button's label. */
  inverseText: '#efe5d7',
} as const

/** Which token each email colour mirrors, for the drift test. */
export const EMAIL_COLOUR_TOKENS: Record<keyof typeof EMAIL_COLOURS, string> = {
  surface: '--color-surface',
  raised: '--color-surface-raised',
  text: '--color-text',
  muted: '--color-text-muted',
  subtle: '--color-text-subtle',
  line: '--color-line',
  ornament: '--color-ornament',
  inverse: '--color-surface-inverse',
  inverseText: '--color-text-inverse',
}
