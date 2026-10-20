import { Container } from '@/components/primitives/Container'
import { Eyebrow } from '@/components/primitives/Eyebrow'
import { PayloadImage } from '@/components/primitives/PayloadImage'
import { Sparkle } from '@/components/primitives/Sparkle'
import { SplitText, countPieces } from '@/components/primitives/SplitText'
import type { Home } from '@/payload-types'
import { textClasses } from '@/styles/variants'

/**
 * "Made by women, for women": a centred statement, then photograph cards with
 * their copy at the foot, as on the Webflow site.
 */
export function Community({ home }: { home: Home }) {
  const cards = home.communityCards ?? []

  return (
    <section aria-labelledby="community-heading" className="section-y">
      <Container width="statement" className="flex flex-col items-center gap-4 text-center">
        <div data-reveal="pending" className="flex flex-col items-center gap-4">
          <Eyebrow>
            <SplitText text={home.communityEyebrow} by="words" />
          </Eyebrow>
          <h2
            id="community-heading"
            className={[textClasses('statement', 'default'), 'max-w-[30ch] text-balance'].join(' ')}
          >
            <SplitText
              text={home.communityStatement}
              by="words"
              offset={countPieces(home.communityEyebrow, 'words')}
            />
          </h2>
        </div>
      </Container>

      {cards.length > 0 ? (
        <ul className="mt-12 grid gap-4 frame md:mt-16 md:grid-cols-2">
          {cards.map((card) => (
            <li
              key={card.id ?? card.title}
              className="relative ground-dark flex min-h-[70svh] flex-col justify-end overflow-hidden rounded-frame bg-surface-inverse p-6 text-text-inverse md:p-8 lg:pr-32"
            >
              <PayloadImage
                media={card.image}
                fill
                sizes="(min-width: 48rem) 50vw, 100vw"
                decorative
              />
              <div aria-hidden="true" className="absolute inset-0 scrim-foot" />
              <div className="relative flex flex-col gap-3">
                <Sparkle className="size-5" />
                <h3 className="font-display text-3xl leading-snug">{card.title}</h3>
                <span aria-hidden="true" className="h-px w-8 bg-text-inverse" />
                <p className="max-w-measure text-sm leading-relaxed md:text-base">{card.body}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
