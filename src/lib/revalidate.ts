import { revalidatePath, revalidateTag } from 'next/cache'

/**
 * Cache invalidation, as Payload hooks.
 *
 * Public pages read their copy through `unstable_cache` (content.ts), so an
 * editor's save has to tell Next the data changed, or the admin says "saved"
 * and the site keeps serving the old copy.
 */
export const CACHE_TAGS = {
  site: 'site-settings',
  home: 'home',
  about: 'about',
} as const

/**
 * `revalidateTag`'s second argument, mandatory since Next 16. `'max'` keeps the
 * entry until something invalidates it again: only an editor's save changes
 * this data, so there is no interval at which re-fetching would help.
 */
const UNTIL_CHANGED = 'max'

/**
 * Run an invalidation, unless there is no Next request to run it in.
 *
 * Payload fires hooks wherever the write happened, including `pnpm run seed`.
 * Outside a request `revalidateTag` throws `static generation store missing`,
 * which aborts the write that triggered it. Only that invariant is swallowed: a
 * CLI process has no page cache to invalidate.
 */
function invalidate(run: () => void): void {
  try {
    run()
  } catch (error) {
    if (error instanceof Error && error.message.includes('static generation store')) return
    throw error
  }
}

/**
 * Everything at once. The site has three pages, every one of them reads site
 * settings in its layout, and media appears across all three, so working out
 * which page a change touched would save nothing worth the code.
 */
export function revalidateSite(): void {
  invalidate(() => {
    for (const tag of Object.values(CACHE_TAGS)) revalidateTag(tag, UNTIL_CHANGED)
    revalidatePath('/', 'layout')
  })
}
