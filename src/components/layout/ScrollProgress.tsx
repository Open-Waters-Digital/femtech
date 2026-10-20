'use client'

import { type ReactNode, useEffect, useRef } from 'react'

import { type ScrollRange, easeTowards, isSettled, scrollTarget } from '@/lib/scroll-progress'

/**
 * A section whose motion follows the scroll: the hero receding, and the
 * coming-soon photographs rising. It writes --scroll-progress (0 to 1) on
 * itself and owns nothing else; components.css turns the number into motion.
 *
 * "use client" because Firefox does not run CSS scroll-driven animation, and
 * because Webflow's `scrub: 0.8` glide is an ease over time that CSS cannot
 * express (src/lib/scroll-progress.ts). luxury-gardens' StatementPinController
 * is the same shape.
 *
 * It marks the section `data-scroll-enhanced`, and only a marked section is
 * pinned or moved. Without JavaScript, or under reduced motion, it is never
 * marked: the hero stays full size and the photographs sit stacked.
 *
 * One passive scroll listener, attached only while the section is on the
 * screen, and frames requested only until the drawn value settles. The
 * section's content is server-rendered children; nothing else reaches the
 * bundle.
 */
export function ScrollProgress({
  range,
  className,
  id,
  'aria-labelledby': ariaLabelledBy,
  children,
}: {
  range: ScrollRange
  className?: string
  id?: string
  'aria-labelledby'?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const section = ref.current
    if (!section) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let current = 0
    let frame = 0
    let last: number | null = null

    const target = () => {
      const box = section.getBoundingClientRect()
      return scrollTarget(range, {
        top: box.top,
        height: box.height,
        viewportHeight: window.innerHeight,
      })
    }
    const write = () => section.style.setProperty('--scroll-progress', current.toFixed(4))

    const tick = (now: number) => {
      const goal = target()
      current = easeTowards({ current, target: goal, dt: last === null ? 0 : now - last })
      last = now
      write()
      if (isSettled(current, goal)) {
        frame = 0
        last = null
        return
      }
      frame = window.requestAnimationFrame(tick)
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(tick)
    }
    // Straight to the target with no glide: on load, and on arriving and
    // leaving, so a jump past the section (a link to an anchor, a fast fling)
    // leaves it finished or unstarted rather than easing across the screen.
    const jump = () => {
      if (frame) window.cancelAnimationFrame(frame)
      frame = 0
      last = null
      current = target()
      write()
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        jump()
        window.addEventListener('scroll', schedule, { passive: true })
        window.addEventListener('resize', schedule)
      } else {
        window.removeEventListener('scroll', schedule)
        window.removeEventListener('resize', schedule)
        jump()
      }
    })

    // Marked before the first measure: marking is what makes the track tall
    // enough to pin, and the progress depends on that height.
    section.setAttribute('data-scroll-enhanced', '')
    jump()
    observer.observe(section)

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) window.cancelAnimationFrame(frame)
      section.removeAttribute('data-scroll-enhanced')
      section.style.removeProperty('--scroll-progress')
    }
  }, [range])

  return (
    <section ref={ref} id={id} aria-labelledby={ariaLabelledBy} className={className}>
      {children}
    </section>
  )
}
