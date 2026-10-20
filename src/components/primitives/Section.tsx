import type { ReactNode } from 'react'

import { type SectionTone, sectionClasses } from '@/styles/variants'

/**
 * A band of the page with its own ground and the vertical rhythm. The tone is
 * here rather than on the Container so the colour runs full-bleed while the
 * content stays on the page's axis.
 */
export function Section({
  tone = 'default',
  children,
  className,
  id,
  'aria-labelledby': ariaLabelledBy,
}: {
  tone?: SectionTone
  children: ReactNode
  className?: string
  id?: string
  'aria-labelledby'?: string
}) {
  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={[sectionClasses(tone), className].filter(Boolean).join(' ')}
    >
      {children}
    </section>
  )
}
