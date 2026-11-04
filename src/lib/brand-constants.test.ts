import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { EMAIL_COLOURS, EMAIL_COLOUR_TOKENS, THEME_COLOR } from '@/lib/brand-constants'

const tokens = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8')

function token(name: string): string | undefined {
  const escaped = name.replace(/[-]/g, '\\-')
  return new RegExp(`${escaped}:\\s*(#[0-9a-fA-F]{6})\\b`).exec(tokens)?.[1]?.toLowerCase()
}

describe('brand constants stay in step with tokens.css', () => {
  it('the theme colour is the surface', () => {
    expect(THEME_COLOR).toBe(token('--color-surface'))
  })

  it.each(Object.entries(EMAIL_COLOUR_TOKENS))('email %s mirrors %s', (key, name) => {
    const value = EMAIL_COLOURS[key as keyof typeof EMAIL_COLOURS]
    expect(token(name), `${name} not found in tokens.css`).toBeDefined()
    expect(value).toBe(token(name))
  })
})
