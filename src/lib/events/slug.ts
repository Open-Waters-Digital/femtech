/**
 * An event's address under /events. Derived from the title when an editor
 * leaves it empty, and refused when it would collide with a route of its own.
 */

/** Paths under /events that are routes, not events. */
export const RESERVED_SLUGS = ['withdraw'] as const

export function slugify(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '')
}

/** `true`, or the admin's message. */
export function validateSlug(value: string | null | undefined): true | string {
  if (!value) return 'Give the event a slug, or a title to make one from.'
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    return 'Use lower-case letters, numbers and single hyphens only.'
  }
  if ((RESERVED_SLUGS as readonly string[]).includes(value)) {
    return `"${value}" is used by the site itself. Choose another slug.`
  }
  return true
}

/** The organiser's page: optional, and an https address when given. */
export function validateOrganiserUrl(value: string | null | undefined): true | string {
  if (!value) return true
  try {
    const url = new URL(value)
    if (url.protocol === 'https:' && url.hostname.includes('.')) return true
  } catch {
    // Not a URL at all; the message below covers it.
  }
  return 'Use a full address starting https://'
}
