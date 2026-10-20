/**
 * A blunt per-IP fixed window, held in memory.
 *
 * This is a backstop, not the real defence: the honeypot, the dwell token and
 * the schema do the work. It exists so one client cannot hammer the
 * endpoint.
 *
 * In-memory means per-instance. That is correct on a single Railway container
 * and becomes decorative the moment a second replica exists, which is why the
 * service is pinned to one replica and why moving this to a shared store is on
 * the pre-launch hardening list rather than left to be discovered under load.
 */
const WINDOW_MS = 10 * 60 * 1000

/**
 * Five in ten minutes. Generous for a form a person fills in once, because an
 * office or a conference shares one address and several people may sign up
 * from it in the same coffee break.
 */
const MAX_PER_WINDOW = 5

type Window = { count: number; resetAt: number }

const windows = new Map<string, Window>()

/** Bounded, so a flood of unique addresses cannot grow the map without limit. */
const MAX_TRACKED = 10_000

export function rateLimit(
  key: string,
  now: number = Date.now(),
  max: number = MAX_PER_WINDOW,
): { allowed: boolean } {
  const existing = windows.get(key)

  if (!existing || now >= existing.resetAt) {
    if (windows.size >= MAX_TRACKED) {
      for (const [k, w] of windows) {
        if (now >= w.resetAt) windows.delete(k)
      }
      // Still full of live windows: refuse rather than grow. Under that much
      // pressure the endpoint is being attacked, and failing closed is right.
      if (windows.size >= MAX_TRACKED) return { allowed: false }
    }

    windows.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true }
  }

  existing.count += 1
  return { allowed: existing.count <= max }
}

/** Test seam. */
export function resetRateLimit(): void {
  windows.clear()
}

/**
 * Railway sits behind a proxy, so the socket address is the proxy's. The
 * left-most entry in x-forwarded-for is the client; anything after it was
 * appended by an intermediary.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  const first = forwarded?.split(',')[0]?.trim()
  return first || headers.get('x-real-ip') || 'unknown'
}
