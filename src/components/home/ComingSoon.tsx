import type { CSSProperties } from 'react'

import { ScrollProgress } from '@/components/layout/ScrollProgress'
import { Eyebrow } from '@/components/primitives/Eyebrow'
import { PayloadImage } from '@/components/primitives/PayloadImage'
import { Sparkle } from '@/components/primitives/Sparkle'
import { SplitText, countPieces } from '@/components/primitives/SplitText'
import type { Home } from '@/payload-types'
import { textClasses } from '@/styles/variants'

/**
 * The Webflow stack's angles, first to last: where each photograph starts its
 * rise and where it settles. The last lands on top.
 */
const ROTATIONS = [
  { from: '40deg', to: '1deg' },
  { from: '-40deg', to: '6deg' },
  { from: '40deg', to: '-3deg' },
] as const

/**
 * The statement pinned under the hero, its words fading in as it arrives, with
 * the photographs rising one over the next as the visitor scrolls, in every
 * browser. The motion is ScrollProgress and components.css ("Coming soon").
 * Without JavaScript, or under reduced motion, there is no pin and no motion,
 * just the photographs stacked.
 */
export function ComingSoon({ home }: { home: Home }) {
  const photos = (home.comingSoonPhotos ?? []).slice(0, ROTATIONS.length)

  return (
    <ScrollProgress
      range="track"
      id="coming-soon"
      aria-labelledby="coming-soon-heading"
      className="coming-soon-track"
    >
      <div className="coming-soon-panel gutter">
        <div
          data-reveal="pending"
          className="flex max-w-statement flex-col items-center gap-4 text-center"
        >
          <Eyebrow>
            <SplitText text={home.comingSoonEyebrow} by="words" />
          </Eyebrow>
          <h2
            id="coming-soon-heading"
            className={[textClasses('statement', 'default'), 'text-balance'].join(' ')}
          >
            <Sparkle className="me-3 inline-block size-[1em] -translate-y-[0.1em] text-ornament" />
            <SplitText
              text={home.comingSoonStatement}
              by="words"
              offset={countPieces(home.comingSoonEyebrow, 'words')}
            />
            <Sparkle className="ms-3 inline-block size-[1em] -translate-y-[0.1em] text-ornament" />
          </h2>
        </div>
        <div className="coming-soon-photos">
          {photos.map((photo, index) => (
            <div
              key={typeof photo === 'number' ? photo : photo.id}
              className="coming-soon-photo"
              style={
                {
                  '--photo-from': ROTATIONS[index]?.from,
                  '--photo-rotate': ROTATIONS[index]?.to,
                } as CSSProperties
              }
            >
              <PayloadImage media={photo} fill sizes="(min-width: 48rem) 80vh, 88vw" />
            </div>
          ))}
        </div>
      </div>
    </ScrollProgress>
  )
}
