import { SplitText } from '@/components/primitives/SplitText'

/**
 * A label that rolls up on hover, piece by piece from the last: the Webflow
 * site's button (by word) and nav link (by letter) interactions.
 *
 * Both drawn copies are hidden from assistive technology and the text is given
 * once, whole, as visually hidden text. Without that, a run of inline-block
 * letters is named letter by letter: Chrome announced the nav link as
 * "A b o u t U s".
 *
 * The element it sits in takes the `roll-host` class, which is what the hover
 * is read from; see components.css, "Rolling labels".
 */
export function RollingLabel({ text, by }: { text: string; by: 'chars' | 'words' }) {
  return (
    <>
      <span className="sr-only">{text}</span>
      <span className="roll" data-roll={by} aria-hidden="true">
        <span className="roll-line">
          <SplitText text={text} by={by} />
        </span>
        <span className="roll-line">
          <SplitText text={text} by={by} />
        </span>
      </span>
    </>
  )
}
