/**
 * Liveness probe for the container HEALTHCHECK and the Railway health path.
 *
 * Deliberately at `/health` rather than `/api/health`: Payload owns
 * `/api/[...slug]`, and routing a health check through the CMS would make the
 * probe fail for reasons unrelated to the process being alive.
 *
 * This checks that the server is up and serving. It does not check the database,
 * because a liveness probe that fails on a slow query gets the container killed
 * during exactly the incident you need it alive for.
 */
export const dynamic = 'force-dynamic'

export function GET(): Response {
  return Response.json({ status: 'ok' }, { status: 200 })
}
