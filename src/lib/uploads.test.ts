import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  IMAGE_UPLOAD_COLLECTIONS,
  UPLOAD_COLLECTIONS,
  uploadImagePatterns,
  versionedUploadUrl,
} from '@/lib/uploads'

/**
 * Guards a failure no other check catches: an upload collection missing from
 * UPLOAD_COLLECTIONS breaks next/image at request time only. `next build`,
 * lint and typecheck all pass.
 *
 * Reads the collection source rather than importing the Payload config, which
 * would pull sharp and the Postgres adapter into a jsdom test to read two slugs.
 */
const COLLECTIONS_DIR = path.join(process.cwd(), 'src/collections')

function uploadCollectionsInSource(): string[] {
  const slugs: string[] = []
  for (const file of readdirSync(COLLECTIONS_DIR)) {
    if (!file.endsWith('.ts') || file.endsWith('.test.ts')) continue
    const source = readFileSync(path.join(COLLECTIONS_DIR, file), 'utf8')
    // `upload:` at the config's top level, indented by two, so the word in a
    // comment or a nested field does not match.
    if (!/^ {2}upload: \{/m.test(source)) continue
    const slug = /^ {2}slug: '([^']+)'/m.exec(source)?.[1]
    if (slug) slugs.push(slug)
  }
  return slugs.sort()
}

describe('UPLOAD_COLLECTIONS', () => {
  it('lists exactly the collections that declare an upload block', () => {
    expect(uploadCollectionsInSource()).toEqual([...UPLOAD_COLLECTIONS].sort())
  })

  it('finds the ones we know about, so the scan is not silently matching nothing', () => {
    expect(uploadCollectionsInSource()).toEqual(['media', 'videos'])
  })
})

describe('uploadImagePatterns', () => {
  it('produces one localPatterns entry per image collection', () => {
    expect(uploadImagePatterns()).toEqual([{ pathname: '/api/media/file/**' }])
  })

  it('never lets the video collection reach the image optimiser', () => {
    expect(IMAGE_UPLOAD_COLLECTIONS).not.toContain('videos')
  })

  it('is what next.config.ts actually uses, rather than a second copy of it', () => {
    const config = readFileSync(path.join(process.cwd(), 'next.config.ts'), 'utf8')
    expect(config).toContain('uploadImagePatterns')
    expect(config).not.toMatch(/pathname: '\/api\//)
  })
})

describe('versionedUploadUrl', () => {
  const url = '/api/media/file/hero.jpg'

  it('carries the revision, so a re-cropped file under the same name is a new URL', () => {
    expect(versionedUploadUrl(url, '2026-10-19T10:00:00.000Z')).toBe(
      `${url}?v=${Date.parse('2026-10-19T10:00:00.000Z')}`,
    )
  })

  it('appends to an existing query string', () => {
    expect(versionedUploadUrl(`${url}?a=1`, '2026-10-19T10:00:00.000Z')).toMatch(/\?a=1&v=\d+$/)
  })

  it('leaves the URL alone when there is no usable revision', () => {
    expect(versionedUploadUrl(url, undefined)).toBe(url)
    expect(versionedUploadUrl(url, '')).toBe(url)
    expect(versionedUploadUrl(url, 'not a date')).toBe(url)
  })
})
