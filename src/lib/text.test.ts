import { describe, expect, it } from 'vitest'

import { paragraphs } from '@/lib/text'

describe('paragraphs', () => {
  it('splits on blank lines', () => {
    expect(paragraphs('One.\n\nTwo.')).toEqual(['One.', 'Two.'])
  })

  it('treats a blank line with whitespace on it, or Windows line endings, the same', () => {
    expect(paragraphs('One.\r\n  \r\nTwo.')).toEqual(['One.', 'Two.'])
  })

  it('joins a single line break into the paragraph', () => {
    expect(paragraphs('One line\ncontinued.')).toEqual(['One line continued.'])
  })

  it('drops empty paragraphs and is empty for nothing', () => {
    expect(paragraphs('\n\n\nOne.\n\n\n')).toEqual(['One.'])
    expect(paragraphs('')).toEqual([])
    expect(paragraphs(null)).toEqual([])
  })
})
