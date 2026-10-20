import type { ReactNode, Ref } from 'react'

import { type HeadingFace, type HeadingSize, headingClasses } from '@/styles/variants'

/**
 * `level` sets the tag and `size` the appearance, so the document outline and
 * the visual hierarchy can differ without a wrong heading tag.
 */
export function Heading({
  level,
  size = 'lg',
  face = 'display',
  children,
  className,
  id,
  tabIndex,
  ref,
}: {
  level: 1 | 2 | 3 | 4
  size?: HeadingSize
  face?: HeadingFace
  children: ReactNode
  className?: string
  id?: string
  /** -1 where a script moves focus here, as the sign-up form does on success. */
  tabIndex?: -1
  ref?: Ref<HTMLHeadingElement>
}) {
  const Tag = `h${level}` as const
  return (
    <Tag
      className={[headingClasses(size, face), className].filter(Boolean).join(' ')}
      id={id}
      tabIndex={tabIndex}
      ref={ref}
    >
      {children}
    </Tag>
  )
}
