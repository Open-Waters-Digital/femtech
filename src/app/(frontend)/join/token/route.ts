import { mintDwellToken } from '@/lib/dwell-token'

/**
 * Issues a fresh dwell token, for a sign-up form whose page was left open long
 * enough for the token it was rendered with to expire. Not under /api, which
 * Payload owns.
 */
export const dynamic = 'force-dynamic'

export function GET(): Response {
  return Response.json(
    { token: mintDwellToken() },
    // Never cached anywhere, or everyone would share one timestamp.
    { status: 200, headers: { 'cache-control': 'no-store, max-age=0' } },
  )
}
