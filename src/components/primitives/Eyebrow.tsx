import type { ReactNode } from 'react'

import { type TextTone, eyebrowClasses } from '@/styles/variants'

/**
 * The small capitalised label above a statement. A span, not a heading: it
 * names the section for a sighted reader and would be noise in the outline.
 */
export function Eyebrow({
  tone = 'default',
  children,
  className,
}: {
  tone?: TextTone
  children: ReactNode
  className?: string
}) {
  return (
    <span className={['block', eyebrowClasses(tone), className].filter(Boolean).join(' ')}>
      {children}
    </span>
  )
}
