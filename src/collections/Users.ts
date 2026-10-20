import type { CollectionConfig } from 'payload'

/**
 * Admin accounts. No public registration and no public read: this collection
 * exists to sign in to /admin. Payload's auth owns sessions, hashing and the
 * reset flow, and nothing here reimplements any of it.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  access: {
    // Payload's default for an auth collection already requires a user. Stated
    // so a later field addition cannot loosen it by accident.
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [{ name: 'name', type: 'text', required: true }],
}
