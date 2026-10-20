import type { ElementType, ReactNode } from 'react'

import { type TextSize, type TextTone, textClasses } from '@/styles/variants'

/**
 * Body copy. `as` is for the tag, which is a semantic decision; the size and
 * tone axes are the styling, and they are closed sets.
 */
export function Text({
  as: Tag = 'p',
  size = 'base',
  tone = 'muted',
  children,
  className,
  id,
}: {
  as?: ElementType
  size?: TextSize
  tone?: TextTone
  children: ReactNode
  className?: string
  id?: string
}) {
  return (
    <Tag className={[textClasses(size, tone), className].filter(Boolean).join(' ')} id={id}>
      {children}
    </Tag>
  )
}
