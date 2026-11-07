# Design

## Context

luxury-gardens' `brand-the-admin-and-the-site-icons` is the reference. Where
femtech stands:

- `payload.config.ts` sets `theme: 'light'`, `avatar: 'default'`,
  `titleSuffix: ' – FemTech Healthcare Network'`, `defaultOGImageType: 'off'`
  and `noindex`. Those stay.
- `custom.css` sets fourteen of Payload's twenty-one elevation steps, the
  ground, the input ground, the text, and one step each of success and error,
  all as hex literals restating `tokens.css`. Payload reads the steps it skips
  (50 through 950 in fifties), so those fall back to Payload's own grey.
- The generated `(payload)/layout.tsx` imports `custom.css` after
  `@payloadcms/next/css`, whose rules sit in `@layer payload-default`; an
  unlayered rule here wins whatever its specificity.
- `tokens.css` is an `@theme` block. Its `--font-body` (Cabinet Grotesk) shares
  a name with Payload's, as luxury-gardens' Lato does.
- The wordmark is live text — "femtech" with the `wordmark` utility (Zodiak,
  weight 400, `--tracking-tight`) — and the heart mark is
  `public/brand/femtech-mark.png`, a cream raster, used by the hero and the
  emails.

## Decisions

### 1. The palette: map, do not copy

`custom.css` imports `fonts.css` and `tokens.css` and nothing else from the
site: no preflight, no utilities, no `globals.css`, all of which would restyle
Payload's markup. Tailwind emits only the tokens the file references.
Unlayered, on `:root`:

- `--theme-bg`: `--color-surface` (cream). `--theme-input-bg` and
  `--theme-elevation-0`: `--color-surface-raised`. `--theme-elevation-1000` and
  `--theme-text`: `--color-text` (ink).
- Every step between: `color-mix(in oklab, text N%, surface-raised)`. That is
  Payload's own white-to-black ramp in shape, tinted cream as the site is, and
  it fills the steps the current file leaves to Payload.
- Success and error ramps: from `--color-surface-raised` through
  `--color-success` and `--color-danger` at the middle step, darkening into
  `--color-text` beyond it.
- Radii: `--style-radius-s/m/l` from `--radius-sm`, `--radius-button` and
  `--radius-frame`.
- Type: `--font-body` is shared, so a `body { font-family: var(--font-body) }`
  rule is the whole mapping and makes Tailwind emit the token (setting the
  property to itself would be a cycle). `--font-serif` is `--font-display`.

_Rejected:_ keeping the literals and extending the lint rule to CSS. It would
catch the next copy but leave this one as a second layer.

### 2. The marks: server components, the mark as a mask

`admin.components.graphics.Logo` renders the wordmark text and the heart mark
side by side; `graphics.Icon` renders the mark alone. Both are server components
in `src/components/admin/`, named "FemTech Healthcare Network" for assistive
technology. The mark is a `span` with `mask-image: url('/brand/femtech-mark.png')`
and `background: currentColor`, so the one cream file draws in the admin's ink.
Their classes live in `custom.css`, because the admin loads no utilities; the
wordmark class restates the `wordmark` utility's three declarations by
referencing the same tokens (`--font-display`, `--tracking-tight`).

_Rejected:_ an ink copy of the PNG, which is a second drawing of the mark.

### 3. Light only, unchanged

The site has no dark palette. `theme: 'light'` stays.

### 4. Metadata

`admin.meta.icons` points at the site's `/icon.png`, so the admin does not rely
on file-convention precedence; `admin.meta.openGraph` names the network.

## Risks / Trade-offs

- **[Risk] Help text below 4.5:1.** Payload sets field descriptions in
  `--theme-elevation-400`; on luxury-gardens that measured 2.37:1. → Measure;
  lift that text alone, not the ramp, since 400 is also the borders.
- **[Risk] Payload's admin rem is 12–13px, not the site's 16px.** → Size the
  marks in `rem` against Payload's root, as luxury-gardens found, and measure at
  390px and 1440px.
- **[Trade-off]** Anything Payload hard-codes stays; it is recorded, not
  chased.

## Migration Plan

No schema change, no migration. Revert the commit to roll back.

## Measured

Dev server, Chromium, the admin at 390 × 844 and 1440 × 900.

| Measure | Value |
| --- | --- |
| Body text (ink) on the cream ground | 14.73:1 |
| Body text on the raised cream (fields) | 16.34:1 |
| Payload's help-text step (`--theme-elevation-400`) on the ground | 2.57:1 |
| Help text after the lift (`--theme-elevation-650`), on the ground / on raised | 5.67:1 / 6.28:1 |
| Sign-in page width at 390 / 1440 | 390 / 1440 (no sideways scroll) |
| Heart mark on sign-in, 390 / 1440 | 27px / 39px, ink `rgb(23, 20, 17)` |
| Breadcrumb mark | 18 × 18px, ink |
| Font requests | `/fonts/` only, same origin (plus Next's dev overlay font in dev) |
| Dark OS preference | `data-theme="light"`; no theme choice in the account view |

Found while measuring, and fixed in `custom.css`:

- Payload wraps the navigation graphic in a span that is an empty flex item;
  it collapsed to 0 × 0 and took the mask with it. The span is told to fill
  Payload's 18px box.
- Payload drops the outline under `:focus-visible` on breadcrumb links, the
  account link and the document tabs; restored with `--accessibility-outline`.
  The breadcrumb's home link keeps Payload's own `::after` ring.
- react-select's generated class sets `outline: 0 !important` on a select's
  control, so focus showed nothing there. The ring is a 2px shadow in the text
  colour instead.

What the variables do not reach: Payload's hard-coded black-alpha shadows
(`#0000001a` on select controls, `#0003` on hover). They read as neutral on
cream and are left alone.
