'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * The hero's background loop, with a pause control.
 *
 * Moving content that plays for more than five seconds needs a way to stop it
 * (WCAG 2.2.2); the Webflow site had none. It also does not start for anyone who
 * prefers reduced motion: they see the poster, which the server renders beneath
 * this as the page's LCP image, and can still press play.
 *
 * `autoPlay` is deliberately absent from the markup. With it the browser starts
 * the video before this component can check the preference.
 */
export function HeroVideo({ mp4, webm }: { mp4: string | null; webm: string | null }) {
  const video = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  // Set once, on the first frame actually playing. Pausing keeps the frame on
  // screen rather than dropping back to the poster.
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const element = video.current
    if (!element) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // play() rejects when the browser refuses autoplay (Low Power Mode on iOS,
    // for one). The poster stays, which is the right outcome, so it is ignored.
    element.play().catch(() => {})
  }, [])

  if (!mp4 && !webm) return null

  return (
    <>
      <video
        ref={video}
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        tabIndex={-1}
        onPlaying={() => {
          setPlaying(true)
          setStarted(true)
        }}
        onPause={() => setPlaying(false)}
        // Transparent until it is actually playing, so the poster beneath shows
        // through while it loads. The clip's first frame is black, and an
        // opaque video would flash it over the poster.
        className={[
          'absolute inset-0 h-full w-full object-cover transition-opacity duration-slow',
          started ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      >
        {webm ? <source src={webm} type="video/webm" /> : null}
        {mp4 ? <source src={mp4} type="video/mp4" /> : null}
      </video>
      <button
        type="button"
        onClick={() => {
          const element = video.current
          if (!element) return
          if (element.paused) element.play().catch(() => {})
          else element.pause()
        }}
        className="absolute right-4 bottom-4 z-raised rounded-button px-3 text-sm font-medium text-text-inverse/80 hover:text-text-inverse md:right-6 md:bottom-6"
      >
        {playing ? 'Pause video' : 'Play video'}
      </button>
    </>
  )
}
