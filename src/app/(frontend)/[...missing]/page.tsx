import { notFound } from 'next/navigation'

/**
 * Sends any unmatched URL to (frontend)/not-found.tsx.
 *
 * The app has two root layouts, the site's and Payload's, and no layout above
 * them, so an unmatched URL otherwise gets Next's bare default 404 without the
 * site's header, footer or fonts. A catch-all ranks below every real route,
 * Payload's /admin and /api included.
 */
export default function Missing(): never {
  notFound()
}
