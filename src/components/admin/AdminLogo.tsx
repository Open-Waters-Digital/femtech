/**
 * The sign-in page's mark, in place of Payload's: the wordmark as the header
 * sets it, beside the heart mark. Live text in Zodiak and the site's own mark
 * file, so it is the same lockup as the site's rather than an image of it.
 *
 * Styled by classes in the admin's stylesheet, not utilities: the admin does
 * not load the site's Tailwind utilities. See src/app/(payload)/custom.css.
 */
export function AdminLogo() {
  return (
    <span className="ft-admin-logo" role="img" aria-label="FemTech Healthcare Network">
      <span className="ft-admin-logo__word" aria-hidden="true">
        femtech
      </span>
      <span className="ft-admin-mark" aria-hidden="true" />
    </span>
  )
}
