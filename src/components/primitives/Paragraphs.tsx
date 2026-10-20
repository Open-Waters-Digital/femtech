import { paragraphs } from '@/lib/text'

/**
 * A textarea from the CMS, set as paragraphs. The `className` is for the
 * wrapper, which carries the size and colour; the paragraphs inherit them.
 */
export function Paragraphs({
  text,
  className,
}: {
  text: string | null | undefined
  className?: string
}) {
  const items = paragraphs(text)
  if (items.length === 0) return null
  return (
    <div className={['flex flex-col gap-[1em]', className].filter(Boolean).join(' ')}>
      {items.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  )
}
