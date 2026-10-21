/**
 * Style recipes. One per primitive, defined exactly once.
 *
 * Classes are complete literal strings on purpose. Tailwind scans source text,
 * so `bg-${tone}` produces no CSS at all.
 */

/* ------------------------------------------------------------------------
 * Button
 * --------------------------------------------------------------------- */

export type ButtonVariant = 'primary' | 'secondary' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'
/** Which ground the control sits on. Contrast depends on it. */
export type ButtonSurface = 'default' | 'inverse'

const BUTTON_BASE =
  'site-button inline-flex items-center justify-center gap-3 whitespace-nowrap rounded-button ' +
  'border font-body font-medium transition-colors duration-base ease-out ' +
  'disabled:pointer-events-none disabled:opacity-50'

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  // The Webflow button: ink with cream type and the sparkle.
  primary: 'bg-surface-inverse text-text-inverse border-surface-inverse hover:bg-text-muted',
  secondary: 'bg-transparent text-text border-line-control hover:bg-surface-sunken',
  link: 'bg-transparent text-text border-transparent underline underline-offset-4 decoration-line-strong hover:decoration-text',
}

const BUTTON_VARIANTS_INVERSE: Record<ButtonVariant, string> = {
  primary: 'bg-surface text-text border-surface hover:bg-surface-sunken',
  secondary: 'bg-transparent text-text-inverse border-text-inverse hover:bg-text-muted',
  link: 'bg-transparent text-text-inverse border-transparent underline underline-offset-4 decoration-text-inverse-muted hover:decoration-text-inverse',
}

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'text-sm px-4 py-2',
  md: 'text-base px-6 py-3',
  lg: 'text-lg px-8 py-4',
}

/** A link has no box, so it keeps the vertical padding (the touch target) only. */
const BUTTON_SIZES_LINK: Record<ButtonSize, string> = {
  sm: 'text-sm py-2',
  md: 'text-base py-3',
  lg: 'text-lg py-4',
}

export function buttonClasses(
  variant: ButtonVariant,
  size: ButtonSize,
  surface: ButtonSurface = 'default',
): string {
  const tones = surface === 'inverse' ? BUTTON_VARIANTS_INVERSE : BUTTON_VARIANTS
  const sizes = variant === 'link' ? BUTTON_SIZES_LINK : BUTTON_SIZES
  return [BUTTON_BASE, tones[variant], sizes[size]].join(' ')
}

/* ------------------------------------------------------------------------
 * Heading
 * --------------------------------------------------------------------- */

export type HeadingSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'display'
/** Zodiak for a statement, Cabinet Grotesk for a heading that labels. */
export type HeadingFace = 'display' | 'body'

const HEADING_SIZES: Record<HeadingSize, string> = {
  sm: 'text-xl leading-snug',
  md: 'text-2xl leading-snug',
  lg: 'text-3xl leading-snug',
  xl: 'text-4xl leading-tight',
  '2xl': 'text-5xl leading-tight tracking-tight',
  display: 'text-6xl leading-none tracking-tight',
}

const HEADING_FACES: Record<HeadingFace, string> = {
  display: 'font-display font-normal',
  body: 'font-body font-medium',
}

export function headingClasses(size: HeadingSize, face: HeadingFace = 'display'): string {
  return ['text-balance', HEADING_SIZES[size], HEADING_FACES[face]].join(' ')
}

/* ------------------------------------------------------------------------
 * Text and Eyebrow
 * --------------------------------------------------------------------- */

export type TextSize = 'sm' | 'base' | 'lg' | 'lead' | 'statement'
export type TextTone =
  'default' | 'muted' | 'subtle' | 'inverse' | 'inverse-muted' | 'sage' | 'danger'

const TEXT_SIZES: Record<TextSize, string> = {
  sm: 'text-sm leading-normal',
  base: 'text-base leading-relaxed',
  lg: 'text-lg leading-relaxed',
  lead: 'text-lead leading-relaxed',
  // The home page's centred statements: Cabinet Grotesk, large, airy.
  statement: 'text-3xl leading-snug md:leading-normal',
}

/** Shared by Text and Eyebrow, so a tone means the same thing in both. */
const TEXT_TONES: Record<TextTone, string> = {
  default: 'text-text',
  muted: 'text-text-muted',
  subtle: 'text-text-subtle',
  inverse: 'text-text-inverse',
  'inverse-muted': 'text-text-inverse-muted',
  sage: 'text-text-sage',
  danger: 'text-danger',
}

export function toneClasses(tone: TextTone): string {
  return TEXT_TONES[tone]
}

export function textClasses(size: TextSize, tone: TextTone): string {
  return ['font-body', TEXT_SIZES[size], TEXT_TONES[tone]].join(' ')
}

export function eyebrowClasses(tone: TextTone): string {
  return ['eyebrow-face text-xs', TEXT_TONES[tone]].join(' ')
}

/* ------------------------------------------------------------------------
 * Layout
 * --------------------------------------------------------------------- */

export type ContainerWidth = 'measure' | 'statement' | 'content' | 'wide'

const CONTAINER_WIDTHS: Record<ContainerWidth, string> = {
  measure: 'max-w-measure',
  statement: 'max-w-statement',
  content: 'max-w-content',
  wide: 'max-w-wide',
}

export function containerClasses(width: ContainerWidth): string {
  return ['mx-auto w-full gutter', CONTAINER_WIDTHS[width]].join(' ')
}

export type SectionTone = 'default' | 'sunken' | 'inverse' | 'sage'

const SECTION_TONES: Record<SectionTone, string> = {
  default: 'bg-surface text-text',
  sunken: 'bg-surface-sunken text-text',
  inverse: 'ground-dark bg-surface-inverse text-text-inverse',
  sage: 'ground-dark bg-surface-sage text-text-inverse',
}

export function sectionClasses(tone: SectionTone): string {
  return ['section-y', SECTION_TONES[tone]].join(' ')
}

/* ------------------------------------------------------------------------
 * Field
 * --------------------------------------------------------------------- */

export type FieldState = 'default' | 'invalid'
/**
 * What the field wraps. A select draws no native arrow (it differs per browser
 * and cannot take the ink colour), so it leaves room for the chevron Field
 * draws over its right edge.
 */
export type FieldControl = 'input' | 'select'

const FIELD_BASE =
  'block w-full rounded-sm border bg-surface-raised px-4 py-3 font-body text-base text-text ' +
  'transition-colors duration-base ease-out placeholder:text-text-subtle ' +
  'disabled:cursor-not-allowed disabled:opacity-50'

/**
 * Invalid carries a tint as well as a border. A colour change alone is not an
 * accessible signal (WCAG 1.4.1); the message under the field states it in
 * words and aria-invalid states it to a screen reader.
 */
const FIELD_STATES: Record<FieldState, string> = {
  default: 'border-line-control hover:border-text-subtle focus:border-text',
  invalid: 'border-danger bg-danger-soft',
}

const FIELD_CONTROLS: Record<FieldControl, string> = {
  input: '',
  select: 'cursor-pointer appearance-none pr-12',
}

export function fieldClasses(state: FieldState, control: FieldControl = 'input'): string {
  return [FIELD_BASE, FIELD_STATES[state], FIELD_CONTROLS[control]].filter(Boolean).join(' ')
}

/* ------------------------------------------------------------------------
 * CheckboxField
 * --------------------------------------------------------------------- */

/**
 * The box is the browser's own, tinted with accent-color, so it keeps the
 * platform's checked, focus and high-contrast behaviour. Invalid tints the row
 * as a text field tints its box; the message under it says why in words.
 */
const CHECKBOX_ROW_STATES: Record<FieldState, string> = {
  default: 'flex items-start gap-3',
  invalid: 'flex items-start gap-3 rounded-sm bg-danger-soft -mx-3 px-3 py-3',
}

export function checkboxRowClasses(state: FieldState): string {
  return CHECKBOX_ROW_STATES[state]
}

export const CHECKBOX_INPUT_CLASSES = 'mt-0.5 size-5 shrink-0 cursor-pointer accent-surface-inverse'

/* ------------------------------------------------------------------------
 * EventCard and its badge
 * --------------------------------------------------------------------- */

/** Past events stay listed but step back: no raised ground, muted ink. */
export type EventCardTiming = 'upcoming' | 'past'

const EVENT_CARD_TIMINGS: Record<EventCardTiming, string> = {
  upcoming: 'bg-surface-raised text-text',
  past: 'bg-transparent text-text-muted',
}

/**
 * `relative` so the title's link can stretch over the whole card (its ::after
 * covers it), while the focus ring stays on the title where it can be read.
 * Hover lifts the edge only when there is somewhere to go.
 */
const EVENT_CARD_BASE =
  'relative flex h-full flex-col gap-4 rounded-frame border border-line p-6 md:p-8 ' +
  'transition-colors duration-base ease-out'

const EVENT_CARD_LINKED = 'hover:border-line-strong'

export function eventCardClasses(timing: EventCardTiming, linked: boolean): string {
  return [EVENT_CARD_BASE, EVENT_CARD_TIMINGS[timing], linked ? EVENT_CARD_LINKED : '']
    .filter(Boolean)
    .join(' ')
}

/** Whether a hosted event takes RSVPs, and a cancelled event's mark. */
export type EventBadge = 'open' | 'full' | 'closed' | 'cancelled'

const EVENT_BADGE_BASE =
  'inline-flex items-center rounded-full border px-3 py-1 font-body text-xs font-medium'

const EVENT_BADGES: Record<EventBadge, string> = {
  open: 'border-success text-success',
  full: 'border-line-strong text-text-muted',
  closed: 'border-line-strong text-text-muted',
  cancelled: 'border-danger text-danger',
}

export function eventBadgeClasses(badge: EventBadge): string {
  return [EVENT_BADGE_BASE, EVENT_BADGES[badge]].join(' ')
}
