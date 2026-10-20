import NextImage from 'next/image'

import { HeroVideo } from '@/components/home/HeroVideo'
import { ScrollProgress } from '@/components/layout/ScrollProgress'
import { PayloadImage } from '@/components/primitives/PayloadImage'
import { SplitText, countPieces } from '@/components/primitives/SplitText'
import { versionedUploadUrl } from '@/lib/uploads'
import type { Home, Video } from '@/payload-types'

function videoUrl(video: number | Video | null | undefined): string | null {
  if (!video || typeof video === 'number' || !video.url) return null
  return versionedUploadUrl(video.url, video.updatedAt)
}

/**
 * The opening screen, as on the Webflow site: a framed, full-height video with
 * the mark, the wordmark at seventeen viewport-widths and the introduction
 * centred over it, and "Discover" at the foot.
 *
 * It plays the site's opening on load (the `intro-*` classes, CSS) and recedes
 * as it scrolls away (`hero-recede`, driven by ScrollProgress); see
 * components.css.
 */
export function Hero({ home }: { home: Home }) {
  const strong = home.heroLeadStrong ?? ''
  const rest = home.heroLead ?? ''
  // One sequence across the bold sentence and the rest, so the words arrive in
  // reading order over the same second.
  const leadWords = countPieces(strong, 'words') + countPieces(rest, 'words')

  return (
    <ScrollProgress
      range="exit"
      aria-labelledby="hero-title"
      className="hero-recede relative min-h-svh"
    >
      <div className="absolute inset-0 frame">
        <div className="relative h-full w-full overflow-hidden rounded-frame bg-surface-inverse">
          {/* The poster is the LCP element, so it is the server-rendered,
              preloaded image; the video lays over it once it plays. */}
          <PayloadImage media={home.heroPoster} fill preload sizes="100vw" decorative />
          <HeroVideo mp4={videoUrl(home.heroVideoMp4)} webm={videoUrl(home.heroVideoWebm)} />
          <div aria-hidden="true" className="absolute inset-0 scrim-radial" />
        </div>
      </div>

      <div className="relative ground-dark flex min-h-svh flex-col items-center justify-center gutter pt-24 pb-28 text-center text-text-inverse">
        <NextImage
          src="/brand/femtech-mark.png"
          alt=""
          width={58}
          height={61}
          unoptimized
          className="intro-mark -mb-2 h-auto w-12 md:-mb-4 md:w-16"
        />
        {/* Labelled with the whole word, and the letters hidden, so it is
            announced as one word rather than spelled. */}
        <h1
          id="hero-title"
          aria-label={home.heroTitle}
          className="intro-title wordmark text-wordmark"
        >
          <span aria-hidden="true">
            <SplitText text={home.heroTitle} by="chars" />
          </span>
        </h1>
        <p className="intro-lead max-w-measure text-base leading-normal text-balance md:text-lg">
          <strong className="font-bold">
            <SplitText text={strong} by="words" total={leadWords} />
          </strong>
          {rest ? ' ' : null}
          <SplitText
            text={rest}
            by="words"
            offset={countPieces(strong, 'words')}
            total={leadWords}
          />
        </p>
      </div>

      <a
        href="#coming-soon"
        aria-label={home.discoverLabel}
        className="absolute inset-x-0 bottom-8 mx-auto flex min-h-11 w-max items-center px-4 text-text-inverse no-underline hover:underline md:bottom-12"
      >
        <span aria-hidden="true" className="intro-discover">
          <SplitText text={home.discoverLabel} by="chars" />
        </span>
      </a>
    </ScrollProgress>
  )
}
