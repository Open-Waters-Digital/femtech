/**
 * The four-pointed sparkle: the brand's ornament, in buttons, beside the home
 * page's statement, on cards and after the footer wordmark.
 *
 * Drawn in currentColor, so its colour is the text colour of wherever it sits.
 * Decorative everywhere it is used, so hidden from assistive technology.
 */
export function Sparkle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 30 30"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M15 0L17.4578 11.4454C17.5758 11.995 18.005 12.4242 18.5546 12.5422L30 15L18.5546 17.4578C18.005 17.5758 17.5758 18.005 17.4578 18.5546L15 30L12.5422 18.5546C12.4242 18.005 11.995 17.5758 11.4454 17.4578L0 15L11.4454 12.5422C11.995 12.4242 12.4242 11.995 12.5422 11.4454L15 0Z" />
    </svg>
  )
}
