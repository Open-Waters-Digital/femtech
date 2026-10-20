import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SplitText, countPieces, splitPieces } from '@/components/primitives/SplitText'

describe('splitPieces', () => {
  it('splits characters, keeping spaces as characters', () => {
    expect(splitPieces('Hi you', 'chars')).toEqual(['H', 'i', ' ', 'y', 'o', 'u'])
  })

  it('splits words, keeping the whitespace between them', () => {
    expect(splitPieces('Women supporting  women', 'words')).toEqual([
      'Women',
      ' ',
      'supporting',
      '  ',
      'women',
    ])
  })

  it('keeps a curly apostrophe and a hyphen inside their word', () => {
    expect(splitPieces('women’s future-ready', 'words')).toEqual(['women’s', ' ', 'future-ready'])
  })
})

describe('countPieces', () => {
  it('does not count whitespace as a word', () => {
    expect(countPieces('One two three', 'words')).toBe(3)
  })
})

describe('SplitText', () => {
  it('numbers each word and leaves the text reading normally', () => {
    const { container } = render(
      <p>
        <SplitText text="One two" by="words" />
      </p>,
    )
    const spans = container.querySelectorAll('.split-piece')
    expect(spans).toHaveLength(2)
    expect(spans[1]?.getAttribute('style')).toContain('--i: 1')
    expect(spans[1]?.getAttribute('style')).toContain('--n: 2')
    expect(container.textContent).toBe('One two')
  })

  it('continues a sequence from an offset, against a shared total', () => {
    const { container } = render(<SplitText text="three four" by="words" offset={2} total={4} />)
    const style = container.querySelector('.split-piece')?.getAttribute('style') ?? ''
    expect(style).toContain('--i: 2')
    expect(style).toContain('--n: 4')
  })
})
