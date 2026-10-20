/**
 * How far through its scroll range a section is, from 0 to 1, and how the
 * drawn value follows it. ScrollProgress reads the boxes and writes the
 * answer to --scroll-progress; components.css turns that into motion.
 *
 * The Webflow site ran these with GSAP ScrollTrigger. CSS scroll-driven
 * animation could express the ranges but runs in Chrome and Safari 26 only,
 * not Firefox, and cannot express GSAP's `scrub: 0.8`, the short glide that
 * lets a mouse wheel's notches ease rather than step. The same approach as
 * luxury-gardens' StatementPinController and src/lib/pinned-reveal.ts there.
 *
 * No DOM, so the rules are tested without a browser.
 */

export type ScrollRange = 'track' | 'exit'

type Box = {
  /** The section's top, relative to the viewport. */
  top: number
  height: number
  viewportHeight: number
}

/**
 * `track`: from the section's top meeting the screen's foot to its foot
 * meeting the screen's foot. Webflow's "top bottom" to "bottom bottom", the
 * coming-soon photographs' range.
 *
 * `exit`: from the section's foot meeting the screen's foot to its foot
 * leaving the screen's top. For the full-height hero at the top of the page,
 * that is from no scroll at all until it has scrolled away: Webflow's "top
 * bottom" to "bottom top", clamped to the page.
 */
export function scrollTarget(range: ScrollRange, { top, height, viewportHeight }: Box): number {
  if (height <= 0 || viewportHeight <= 0) return 0
  const through =
    range === 'track'
      ? (viewportHeight - top) / height
      : (viewportHeight - (top + height)) / viewportHeight
  return Math.min(1, Math.max(0, through))
}

/**
 * GSAP's `scrub: 0.8` means the animation takes about 0.8s to catch up with
 * the scrollbar. An exponential approach with this time constant is 95% of the
 * way there in 3τ, about 0.75s.
 */
export const SCRUB_TAU_MS = 250

/** Closer than this to the target and the motion is at rest. */
export const SCRUB_SETTLED = 0.0005

/**
 * One frame of easing towards the target. Exponential in time, so a 120Hz
 * screen and a 60Hz one arrive at the same place after the same time.
 */
export function easeTowards({
  current,
  target,
  dt,
  tau = SCRUB_TAU_MS,
}: {
  current: number
  target: number
  dt: number
  tau?: number
}): number {
  if (dt <= 0) return current
  if (tau <= 0) return target
  const next = current + (target - current) * (1 - Math.exp(-dt / tau))
  return isSettled(next, target) ? target : next
}

export function isSettled(current: number, target: number): boolean {
  return Math.abs(target - current) < SCRUB_SETTLED
}

/**
 * How far through one photograph's rise the section is, eased: the rule
 * components.css writes in calc() for each photograph, stated here so it is
 * tested. Each rises over `length` of the range starting at `start`, eased
 * in quadratically (GSAP's power1.in).
 */
export function stageEased(progress: number, start: number, length: number): number {
  if (length <= 0) return progress >= start ? 1 : 0
  const stage = Math.min(1, Math.max(0, (progress - start) / length))
  return stage * stage
}
