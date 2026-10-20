'use client'

import NextLink from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'

import { NAV_ITEMS, SIGN_UP_PATH, isCurrent } from '@/components/layout/navigation'
import { Button } from '@/components/primitives/Button'

/**
 * The navigation below md, as a full-screen panel.
 *
 * The only client component in the chrome. Escape closes it and returns focus
 * to the button; following a link closes it. Without JavaScript the button does
 * nothing, and the footer carries the same links, so nothing is unreachable.
 */
export function MobileMenu({ tone, pathname }: { tone: 'light' | 'dark'; pathname: string }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const toggle = useRef<HTMLButtonElement>(null)
  const firstLink = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    if (!open) return
    firstLink.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      toggle.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    // The page underneath must not scroll behind the panel.
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <div className="md:hidden">
      <button
        ref={toggle}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={[
          'relative z-menu flex min-w-11 items-center gap-2 px-2 font-medium',
          open ? 'text-text-inverse' : tone === 'light' ? 'text-text-inverse' : 'text-text',
        ].join(' ')}
      >
        {open ? 'Close' : 'Menu'}
        <span aria-hidden="true" className="flex w-5 flex-col gap-1.5">
          <span
            className={[
              'h-px w-full bg-current transition-transform duration-base',
              open ? 'translate-y-[3.5px] rotate-45' : '',
            ].join(' ')}
          />
          <span
            className={[
              'h-px w-full bg-current transition-transform duration-base',
              open ? '-translate-y-[3.5px] -rotate-45' : '',
            ].join(' ')}
          />
        </span>
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="ground-dark fixed inset-0 z-header flex-col justify-between bg-surface-inverse px-5 pt-28 pb-10 text-text-inverse data-[open=true]:flex"
        data-open={open}
      >
        <nav aria-label="Main">
          <ul className="flex flex-col gap-4">
            <li>
              <NextLink
                ref={firstLink}
                href="/"
                onClick={() => setOpen(false)}
                aria-current={pathname === '/' ? 'page' : undefined}
                className="wordmark text-4xl no-underline aria-[current=page]:underline"
              >
                Home
              </NextLink>
            </li>
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                {item.href ? (
                  <NextLink
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={isCurrent(item.href, pathname) ? 'page' : undefined}
                    className="wordmark text-4xl no-underline aria-[current=page]:underline"
                  >
                    {item.label}
                  </NextLink>
                ) : (
                  <span className="wordmark text-4xl text-text-inverse-muted">{item.label}</span>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <Button href={SIGN_UP_PATH} surface="inverse" size="lg" onClick={() => setOpen(false)}>
          Sign Up
        </Button>
      </div>
    </div>
  )
}
