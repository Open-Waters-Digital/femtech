/**
 * The network's social profiles: which platforms site settings offers, the
 * name each is announced by, and the hosts a profile URL may point at.
 *
 * A platform is added here, in the mark paths (`components/social/SocialMark`),
 * and as a migration for the select's enum. Nowhere else.
 */
export const SOCIAL_PLATFORMS = ['linkedin', 'instagram', 'facebook', 'x'] as const

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]

/**
 * The name a screen reader announces. A mark on its own announces nothing, and
 * a <title> inside an SVG is read inconsistently, so the name lives on the link.
 */
export const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  facebook: 'Facebook',
  x: 'X',
}

/** X still answers on twitter.com, and editors paste either. */
const PLATFORM_HOSTS: Record<SocialPlatform, readonly string[]> = {
  linkedin: ['linkedin.com'],
  instagram: ['instagram.com'],
  facebook: ['facebook.com'],
  x: ['x.com', 'twitter.com'],
}

/**
 * Whether `href` is an https address on the platform's host, or a subdomain of
 * it (www., uk.). Parsed rather than matched as a string, so
 * `https://linkedin.com.example.com/` is not mistaken for LinkedIn.
 */
export function isPlatformUrl(platform: SocialPlatform, href: string): boolean {
  let url: URL
  try {
    url = new URL(href.trim())
  } catch {
    return false
  }
  if (url.protocol !== 'https:') return false
  const host = url.hostname.toLowerCase()
  return PLATFORM_HOSTS[platform].some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`),
  )
}

/** The admin's message for a URL that fails `isPlatformUrl`. */
export function platformUrlMessage(platform: SocialPlatform): string {
  const hosts = PLATFORM_HOSTS[platform].join(' or ')
  return `Use the full ${PLATFORM_LABELS[platform]} address, starting https:// on ${hosts}.`
}

export type SocialProfile = { platform: SocialPlatform; href: string; id?: string | null }

/** The first LinkedIn profile, for the thank-you's invitation. */
export function linkedInUrl(social: readonly SocialProfile[] | null | undefined): string | null {
  return social?.find((profile) => profile.platform === 'linkedin')?.href ?? null
}
