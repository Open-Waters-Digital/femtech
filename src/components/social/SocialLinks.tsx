import { SmartLink } from '@/components/primitives/SmartLink'
import { SocialMark } from '@/components/social/SocialMark'
import { PLATFORM_LABELS, type SocialProfile } from '@/lib/social'

/**
 * The network's social profiles as a row of marks, in the order site settings
 * holds them. After luxury-gardens' row of the same name.
 *
 * Renders nothing when there are no profiles, rather than an empty list with
 * its spacing still in place.
 *
 * The 44px target is the link's box, not the mark: a 20px mark inside a 44px
 * box. The list pulls the spare 12px back on each side so the first mark
 * starts on the copy's own edge.
 *
 * No colour of its own. The mark takes the foreground of whatever it sits on,
 * so the row works on cream and on ink alike, and hover dims rather than
 * recolours for the same reason (opacity-70, as the header's "Events" uses).
 */
export function SocialLinks({
  social,
  className,
}: {
  social: readonly SocialProfile[] | null | undefined
  className?: string
}) {
  const profiles = (social ?? []).filter((profile) => profile.href)
  if (profiles.length === 0) return null

  return (
    <ul className={['-mx-3 flex items-center', className].filter(Boolean).join(' ')}>
      {profiles.map((profile) => (
        <li key={profile.id ?? `${profile.platform}-${profile.href}`}>
          <SmartLink
            href={profile.href}
            className="inline-flex size-11 items-center justify-center transition-opacity duration-base hover:opacity-70"
          >
            <SocialMark platform={profile.platform} className="size-5" />
            <span className="sr-only">{PLATFORM_LABELS[profile.platform]}</span>
          </SmartLink>
        </li>
      ))}
    </ul>
  )
}
