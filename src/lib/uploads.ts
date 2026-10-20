/**
 * The upload collections, named once.
 *
 * Three places need this list: next.config.ts (the image optimiser's
 * allow-list), the storage plugin, and uploads.test.ts. On fionacorbett they
 * were maintained separately until a new collection reached two of them and not
 * the third, and the page threw on the first request that rendered one of its
 * files. The test fails if a collection with an `upload` block is missing here.
 */
export const UPLOAD_COLLECTIONS = ['media', 'videos'] as const

export type UploadCollection = (typeof UPLOAD_COLLECTIONS)[number]

/**
 * The upload collections that hold images, and so the only ones next/image may
 * optimise. `videos` goes to the bucket like everything else but has no business
 * reaching the optimiser.
 */
export const IMAGE_UPLOAD_COLLECTIONS = ['media'] as const satisfies readonly UploadCollection[]

/** Payload serves an upload collection's files from `/api/<slug>/file/<filename>`. */
export function uploadFilePattern(slug: UploadCollection): string {
  return `/api/${slug}/file/**`
}

/**
 * `images.localPatterns` for next.config.ts. A list rather than a wildcard: an
 * unrestricted allow-list lets any path on the origin be fed through the image
 * optimiser, which makes it a resource amplifier.
 */
export function uploadImagePatterns(): { pathname: string }[] {
  return IMAGE_UPLOAD_COLLECTIONS.map((slug) => ({ pathname: uploadFilePattern(slug) }))
}

/**
 * An upload's URL with its revision on the end.
 *
 * Re-cropping an image in the admin rewrites the file under the same name, and
 * next/image caches by URL, so the old crop kept being served on fionacorbett.
 * `updatedAt` changes on every save; Payload's file route ignores the query.
 */
export function versionedUploadUrl(url: string, updatedAt: string | null | undefined): string {
  const revision = updatedAt ? Date.parse(updatedAt) : Number.NaN
  if (Number.isNaN(revision)) return url
  return `${url}${url.includes('?') ? '&' : '?'}v=${revision}`
}
