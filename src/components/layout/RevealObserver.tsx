'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Marks each `[data-reveal="pending"]` element `shown` the first time its top
 * enters the screen, which starts its words fading in (components.css,
 * "Reveal"). Once only, as on the Webflow site.
 *
 * One observer for the page rather than a client wrapper per heading, so the
 * headings stay server-rendered. Re-run on navigation, because the layout and
 * this component persist while the page under them changes.
 *
 * Without JavaScript nothing marks them, so the layout's noscript style shows
 * them instead.
 */
export function RevealObserver() {
  const pathname = usePathname()

  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>('[data-reveal="pending"]')
    if (!('IntersectionObserver' in window)) {
      for (const target of targets) target.dataset.reveal = 'shown'
      return
    }
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const target = entry.target as HTMLElement
        target.dataset.reveal = 'shown'
        observer.unobserve(target)
      }
    })
    for (const target of targets) observer.observe(target)
    return () => observer.disconnect()
  }, [pathname])

  return null
}
