import type { CSSProperties } from 'react'

/**
 * Text split into characters or words, each its own span carrying its position
 * (`--i`) and the count (`--n`), so CSS can stagger an animation across them.
 * The Webflow site did this with GSAP's SplitText at runtime; here it is done
 * once, on the server, and the animation is CSS.
 *
 * Words keep the real spaces between them as text, so the copy reads, copies
 * and indexes normally. Characters are set `aria-hidden` and the whole text is
 * given as a label by the caller, because a screen reader may read a run of
 * one-letter spans letter by letter.
 *
 * `offset` and `total` continue a sequence across two runs, as the hero's
 * introduction does across its bold sentence and the rest.
 */
export function SplitText({
  text,
  by,
  offset = 0,
  total,
}: {
  text: string
  by: 'chars' | 'words'
  offset?: number
  total?: number
}) {
  const pieces = splitPieces(text, by)
  const count = total ?? countPieces(text, by)
  let index = offset

  return pieces.map((piece, key) => {
    if (by === 'words' && /^\s+$/.test(piece)) return piece
    const style = { '--i': index, '--n': count } as CSSProperties
    index += 1
    return (
      <span key={key} className="split-piece" style={style}>
        {piece}
      </span>
    )
  })
}

/** Characters, or words with the whitespace between them kept as pieces. */
export function splitPieces(text: string, by: 'chars' | 'words'): string[] {
  if (by === 'chars') return Array.from(text)
  return text.split(/(\s+)/).filter(Boolean)
}

/** How many animated pieces the text has. Whitespace between words is not one. */
export function countPieces(text: string, by: 'chars' | 'words'): number {
  return splitPieces(text, by).filter((piece) => by === 'chars' || !/^\s+$/.test(piece)).length
}
