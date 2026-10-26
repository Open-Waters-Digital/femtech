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

/** An IPv4 or IPv6 address, loosely: enough to refuse a header stuffed with anything else. */
const ADDRESS = /^[0-9a-fA-F:.]{2,45}$/

/**
 * The visitor's address, for keying the rate limit and for Turnstile.
 *
 * Behind Cloudflare (since 26 October 2026), `cf-connecting-ip` comes first.
 * Cloudflare sets it from the connection it received and overwrites any value
 * the visitor sent, so it cannot be forged through Cloudflare.
 * `x-forwarded-for` can: Cloudflare appends to whatever the visitor sent rather
 * than replacing it, so its left-most entry is the visitor's to choose, and a
 * new value per request would sidestep the limit entirely.
 *
 * `x-forwarded-for` remains the fallback for requests that reach Railway
 * without Cloudflare (local development, and the service's own *.up.railway.app
 * address). There `cf-connecting-ip` could be forged too, which is why the
 * Railway address is to be removed once the domain is live (AGENTS.md,
 * "Pre-launch hardening"). The limit is a backstop either way: the honeypot,
 * the dwell token, the schema and, for RSVPs, Turnstile do the real work.
 */
export function clientIp(headers: Headers): string {
  const cloudflare = headers.get('cf-connecting-ip')?.trim()
  if (cloudflare && ADDRESS.test(cloudflare)) return cloudflare

  const forwarded = headers.get('x-forwarded-for')
  const first = forwarded?.split(',')[0]?.trim()
  return first || headers.get('x-real-ip') || 'unknown'
}
