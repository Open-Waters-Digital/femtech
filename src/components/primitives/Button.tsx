import NextLink from 'next/link'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'

import { RollingLabel } from '@/components/primitives/RollingLabel'
import { Sparkle } from '@/components/primitives/Sparkle'
import {
  type ButtonSize,
  type ButtonSurface,
  type ButtonVariant,
  buttonClasses,
} from '@/styles/variants'

type CommonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Set by anything that owns a dark ground, so contrast holds. */
  surface?: ButtonSurface
  /** The label. A string, because the rolling hover draws it twice. */
  children: string
  className?: string
  /** A trailing icon in place of the sparkle, e.g. an arrow on an external link. */
  icon?: ReactNode
}

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & { href?: never }

type ButtonAsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & { href: string }

/**
 * Renders a link when given href, a button otherwise. Not an `as` prop: a link
 * that looks like a button must still be a link, so it opens in a new tab and
 * shows its target like one.
 *
 * Primary and secondary carry the sparkle and the rolling label from the Webflow
 * site (components.css, "Rolling labels"); `link` is a plain underlined label.
 */
export function Button(props: ButtonAsButton | ButtonAsLink) {
  const {
    variant = 'primary',
    size = 'md',
    surface = 'default',
    children,
    className,
    icon,
    ...rest
  } = props
  const classes = [buttonClasses(variant, size, surface), 'roll-host', className]
    .filter(Boolean)
    .join(' ')

  const content =
    variant === 'link' ? (
      children
    ) : (
      <>
        <RollingLabel text={children} by="words" />
        {icon ?? <Sparkle className="size-3 shrink-0" />}
      </>
    )

  if ('href' in rest && typeof rest.href === 'string') {
    const { href, ...anchor } = rest as AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
    const internal = href.startsWith('/') && !href.startsWith('//')
    if (internal) {
      return (
        <NextLink href={href} {...anchor} className={classes}>
          {content}
        </NextLink>
      )
    }
    return (
      <a href={href} {...anchor} className={classes}>
        {content}
      </a>
    )
  }

  return (
    <button {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)} className={classes}>
      {content}
    </button>
  )
}
