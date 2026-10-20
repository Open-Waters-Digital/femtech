import NextImage from 'next/image'

import { versionedUploadUrl } from '@/lib/uploads'
import type { Media } from '@/payload-types'

/**
 * What this component reads from an upload document. Structural rather than
 * `Media`, so a call site can pass a narrowed object, and asserted below so a
 * change to the generated type fails to compile here rather than at runtime.
 */
export type ImageDocument = {
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
  /** Percentages, 0–100, set by clicking the image in the admin. */
  focalX?: number | null
  focalY?: number | null
  /** Changes on every save. Carried on the URL so a re-cropped file is refetched. */
  updatedAt?: string | null
}

/** `satisfies` is an expression operator; a constrained type parameter is the type-level one. */
type MustFit<T extends ImageDocument> = T

type _MediaFits = MustFit<Media>

/**
 * Renders a Payload media document through next/image. Server-rendered, so the
 * image request does not wait for React to hydrate. Width and height come from
 * the document, so the box is reserved before the bytes arrive.
 */
export function PayloadImage({
  media,
  sizes,
  preload = false,
  className,
  fill = false,
  decorative = false,
  onSettled,
}: {
  media: number | ImageDocument | null | undefined
  sizes: string
  /**
   * True only for the LCP image: it loads eagerly and is preloaded from the
   * head. More than one preloaded image competes for bandwidth.
   *
   * Named `preload` rather than `priority` since Next 16, which deprecates the
   * old name. The two produce identical output.
   */
  preload?: boolean
  className?: string
  fill?: boolean
  /**
   * Renders with an empty alt, for an image that illustrates copy sitting on it
   * rather than carrying anything of its own.
   *
   * The media library requires alt text at upload. What is announced at the
   * point of use is a separate decision: a photograph behind a card's own
   * heading and copy would be announced twice.
   */
  decorative?: boolean
  /**
   * Called once the image has loaded or failed to. Only usable from a client
   * component.
   */
  onSettled?: () => void
}) {
  // A depth-0 query returns the id rather than the document: a query bug at the
  // call site, not something to paper over with a placeholder.
  if (!media || typeof media === 'number') return null
  if (!media.url) return null

  // An image is cropped whenever its box is a different shape from the
  // photograph. By default the crop is the centre, which on a two-person shot
  // is the gap between them. The focal point set in the admin moves it onto
  // the subject instead. On an uncropped image `object-position` does nothing,
  // so it is safe to set on every one. Unset, it falls back to the centre.
  const objectPosition = `${media.focalX ?? 50}% ${media.focalY ?? 50}%`

  const common = {
    src: versionedUploadUrl(media.url, media.updatedAt),
    alt: decorative ? '' : (media.alt ?? ''),
    preload,
    className,
    sizes,
    onLoad: onSettled,
    onError: onSettled,
  }

  if (fill) {
    return <NextImage {...common} fill style={{ objectFit: 'cover', objectPosition }} />
  }

  return (
    <NextImage
      {...common}
      width={media.width ?? 1600}
      height={media.height ?? 1200}
      style={{ objectPosition }}
    />
  )
}
