import configPromise from '@payload-config'
import { getPayload } from 'payload'

/**
 * Confirmed places per hosted event, read per request and never cached: a
 * cached count would show a full event as open. Withdrawn places do not count.
 *
 * Registrations are admin-only, so this reads with overrideAccess; it returns
 * numbers only, never a row.
 */
export async function confirmedCounts(eventIds: readonly number[]): Promise<Map<number, number>> {
  const counts = new Map(eventIds.map((id) => [id, 0]))
  if (eventIds.length === 0) return counts

  const payload = await getPayload({ config: await configPromise })
  await Promise.all(
    eventIds.map(async (id) => {
      const { totalDocs } = await payload.count({
        collection: 'event-registrations',
        where: { event: { equals: id }, status: { equals: 'confirmed' } },
        overrideAccess: true,
      })
      counts.set(id, totalDocs)
    }),
  )
  return counts
}
