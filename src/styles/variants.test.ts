import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * Tailwind generates only the classes it finds as literal text. A recipe that
 * builds a class from a template string compiles and produces no CSS, so the
 * component renders unstyled with nothing in any log.
 */
describe('variants.ts', () => {
  // Comments stripped: the file's own warning quotes the pattern it forbids.
  const source = readFileSync(path.join(process.cwd(), 'src/styles/variants.ts'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

  it('builds no class name from a template string', () => {
    expect(source).not.toMatch(/`[^`]*\b(?:bg|text|border|max-w|font)-\$\{/)
  })
})
