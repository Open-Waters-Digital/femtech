import { describe, expect, it } from 'vitest'

import {
  SCRUB_TAU_MS,
  easeTowards,
  isSettled,
  scrollTarget,
  stageEased,
} from '@/lib/scroll-progress'

const VIEWPORT = 900

describe('scrollTarget, track', () => {
  // The coming-soon track: 2700px tall, starting a screen down the page.
  const box = (scrollY: number) => ({ top: 900 - scrollY, height: 2700, viewportHeight: VIEWPORT })

  it('starts as the track’s top meets the screen’s foot', () => {
    expect(scrollTarget('track', box(0))).toBe(0)
  })

  it('finishes as the track’s foot meets the screen’s foot', () => {
    expect(scrollTarget('track', box(2700))).toBe(1)
  })

  it('is linear between, and clamped either side', () => {
    expect(scrollTarget('track', box(1350))).toBeCloseTo(0.5)
    expect(scrollTarget('track', { top: 2000, height: 2700, viewportHeight: VIEWPORT })).toBe(0)
    expect(scrollTarget('track', box(5000))).toBe(1)
  })
})

describe('scrollTarget, exit', () => {
  const hero = (scrollY: number) => ({ top: -scrollY, height: VIEWPORT, viewportHeight: VIEWPORT })

  it('is 0 at the top of the page, for a hero the height of the screen', () => {
    expect(scrollTarget('exit', hero(0))).toBe(0)
  })

  it('reaches 1 as the hero’s foot leaves the top of the screen', () => {
    expect(scrollTarget('exit', hero(450))).toBeCloseTo(0.5)
    expect(scrollTarget('exit', hero(900))).toBe(1)
  })

  it('stays at 0 for a hero taller than the screen until its foot is in view', () => {
    expect(scrollTarget('exit', { top: 0, height: 1200, viewportHeight: VIEWPORT })).toBe(0)
  })

  it('is 0 rather than dividing by zero for an empty box', () => {
    expect(scrollTarget('exit', { top: 0, height: 0, viewportHeight: VIEWPORT })).toBe(0)
  })
})

describe('easeTowards', () => {
  it('closes about 95% of the gap in three time constants', () => {
    const next = easeTowards({ current: 0, target: 1, dt: SCRUB_TAU_MS * 3 })
    expect(next).toBeGreaterThan(0.94)
    expect(next).toBeLessThan(0.96)
  })

  it('arrives at the same place in one long frame as in many short ones', () => {
    let many = 0
    for (let i = 0; i < 10; i += 1) many = easeTowards({ current: many, target: 1, dt: 16 })
    const one = easeTowards({ current: 0, target: 1, dt: 160 })
    expect(many).toBeCloseTo(one, 6)
  })

  it('snaps to the target once settled, so the frame loop can stop', () => {
    expect(easeTowards({ current: 0.9998, target: 1, dt: 16 })).toBe(1)
    expect(isSettled(1, 1)).toBe(true)
  })

  it('does not move on a zero or negative frame', () => {
    expect(easeTowards({ current: 0.3, target: 1, dt: 0 })).toBe(0.3)
    expect(easeTowards({ current: 0.3, target: 1, dt: -5 })).toBe(0.3)
  })
})

describe('stageEased', () => {
  // Webflow's second photograph: 0.15 to 0.40 of a 0.55 timeline.
  const start = 0.15 / 0.55
  const length = 0.25 / 0.55

  it('is 0 before its stage and 1 after', () => {
    expect(stageEased(0.1, start, length)).toBe(0)
    expect(stageEased(0.9, start, length)).toBe(1)
  })

  it('eases in quadratically: a quarter of the way at halfway', () => {
    expect(stageEased(start + length / 2, start, length)).toBeCloseTo(0.25)
  })
})
