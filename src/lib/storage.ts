import { s3Storage } from '@payloadcms/storage-s3'
import type { Plugin } from 'payload'

import { UPLOAD_COLLECTIONS } from '@/lib/uploads'

/**
 * Object storage for uploads.
 *
 * Deployed environments use a Railway S3 bucket. A Railway container's disk does
 * not survive a redeploy, so every image an editor uploads would vanish on the
 * next deploy without this.
 *
 * The variable names here are ours, not Railway's. A Railway bucket exposes
 * BUCKET, ENDPOINT, REGION, ACCESS_KEY_ID and SECRET_ACCESS_KEY; the service
 * maps them across with reference variables. Keeping our own names costs one
 * mapping step and makes moving off Railway a config change rather than a code
 * change.
 *
 * Local development falls back to the disk, so a checkout runs with nothing but
 * Postgres. The switch is the presence of S3_BUCKET rather than NODE_ENV,
 * because staging and production are the same code path and a developer should
 * be able to point at a real bucket when reproducing something.
 */

type S3Settings = {
  bucket: string
  region: string
  endpoint: string
  accessKeyId: string
  secretAccessKey: string
  forcePathStyle: boolean
}

function readS3Settings(): S3Settings | null {
  const bucket = process.env.S3_BUCKET
  if (!bucket) return null

  const region = process.env.S3_REGION
  const endpoint = process.env.S3_ENDPOINT
  const accessKeyId = process.env.S3_ACCESS_KEY_ID
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY

  // Fail closed and fail at boot. A half-configured bucket that silently writes
  // to the container disk looks fine until the first redeploy destroys it.
  const missing = [
    ['S3_REGION', region],
    ['S3_ENDPOINT', endpoint],
    ['S3_ACCESS_KEY_ID', accessKeyId],
    ['S3_SECRET_ACCESS_KEY', secretAccessKey],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name)

  if (missing.length > 0) {
    throw new Error(
      `S3_BUCKET is set but ${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} missing. ` +
        'Object storage is all or nothing.',
    )
  }

  return {
    bucket,
    region: region as string,
    endpoint: endpoint as string,
    accessKeyId: accessKeyId as string,
    secretAccessKey: secretAccessKey as string,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  }
}

/**
 * Every upload collection goes to the same bucket, at its root.
 *
 * Derived from UPLOAD_COLLECTIONS rather than written out, so this is not a
 * third list to keep in step with the other two. A collection missing from here
 * writes to the container disk, and its files disappear on the next deploy.
 */
const MANAGED_COLLECTIONS = Object.fromEntries(
  UPLOAD_COLLECTIONS.map((slug) => [slug, { prefix: '' }]),
)

/**
 * The storage plugin, registered in every environment and enabled only where a
 * bucket is configured.
 *
 * Registered always, because the plugin shapes the schema as well as the
 * storage: from Payload 3.90 it adds a hidden `_objectKey` column to every
 * collection it manages. Registering it conditionally gives the upload tables
 * one shape in production and another on a machine with no bucket, and a
 * migration generated on that machine cannot see the column production needs.
 * The symptom is every media query failing in production with
 * `column media._objectkey does not exist`, and the next migration generated the
 * other way round proposing to drop it.
 *
 * `alwaysInsertFields` is the plugin's own answer: disabled, it adds its fields
 * and does nothing else, so the schema is identical everywhere and a migration
 * generated anywhere is correct everywhere. Payload 4 makes it the default.
 *
 * `prefix: ''` is stated rather than omitted, and it is not decoration. The two
 * paths add the prefix column on different conditions — disabled, because of
 * alwaysInsertFields; enabled, only when the collection names a prefix — so left
 * unset, a migration generated with S3 on proposes dropping a column the
 * without-S3 schema has. An empty prefix is where the objects already are, so it
 * changes no object key.
 *
 * Disabled, the plugin never builds a client, so the placeholder bucket and
 * empty config below are read by nothing.
 */
export function storagePlugins(): Plugin[] {
  const settings = readS3Settings()

  if (!settings) {
    return [
      s3Storage({
        enabled: false,
        alwaysInsertFields: true,
        collections: MANAGED_COLLECTIONS,
        bucket: '',
        config: {},
      }),
    ]
  }

  return [
    s3Storage({
      alwaysInsertFields: true,
      collections: MANAGED_COLLECTIONS,
      bucket: settings.bucket,
      config: {
        region: settings.region,
        endpoint: settings.endpoint,
        // Railway buckets use virtual-hosted-style URLs, with the bucket as a
        // subdomain, so this stays off by default. Older Railway buckets need
        // path style: their Credentials tab says which, and S3_FORCE_PATH_STYLE
        // switches it without a code change.
        forcePathStyle: settings.forcePathStyle,
        credentials: {
          accessKeyId: settings.accessKeyId,
          secretAccessKey: settings.secretAccessKey,
        },
      },
    }),
  ]
}
