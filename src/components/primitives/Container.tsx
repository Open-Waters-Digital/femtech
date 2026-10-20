import type { ReactNode } from 'react'

import { type ContainerWidth, containerClasses } from '@/styles/variants'

/**
 * The page's axis. `content` by default, the width the header and footer sit
 * on; `statement` and `measure` for centred copy, which has to say so.
 */
export function Container({
  width = 'content',
  children,
  className,
}: {
  width?: ContainerWidth
  children: ReactNode
  className?: string
}) {
  return (
    <div className={[containerClasses(width), className].filter(Boolean).join(' ')}>{children}</div>
  )
}
