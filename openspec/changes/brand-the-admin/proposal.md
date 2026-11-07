# Proposal

## Why

The admin is halfway on brand. It is fixed to its light theme and the cream and
ink are there, but `src/app/(payload)/custom.css` gets them by copying about
twenty hex values out of `tokens.css`, and its own comment says to "change this
by hand" when the palette changes. That is a second token layer, which is the
thing the no-hex lint rule exists to prevent; it only escapes because the rule
covers `.ts` and `.tsx`. Payload's logo is still on the sign-in page and its
icon in the navigation, and the admin is set in Payload's own face rather than
Cabinet Grotesk.

luxury-gardens solved both in `brand-the-admin-and-the-site-icons`: the admin
reads the site's tokens rather than copying them, and draws the site's own
marks. This applies that approach here.

## What Changes

- **The palette, from the tokens.** `custom.css` imports `tokens.css` through
  Tailwind and sets Payload's theme variables from it with `color-mix()`: the
  21-step elevation ramp from white to ink, the success and error ramps through
  `--color-success` and `--color-danger`, and the radii. No hex value remains in
  the file. The ramp gains the steps the hand-written one skipped (Payload reads
  all twenty-one).
- **The type.** Cabinet Grotesk for the body and Zodiak for the few places
  Payload asks for a display face, from the self-hosted files in
  `public/fonts/`.
- **The marks.** The sign-in page shows the wordmark — "femtech" in Zodiak, as
  the header sets it — beside the heart mark; the navigation shows the heart
  mark alone. The mark is the existing `public/brand/femtech-mark.png`, drawn
  as a CSS mask so it takes the admin's ink rather than its own cream.
- **Metadata.** Admin tabs and the sign-in page carry the site's icon and
  "FemTech Healthcare Network" as the Open Graph site name, in place of
  Payload's defaults. The title suffix, `noindex` and the disabled share image
  are already set.

## What it costs

- One more stylesheet concern to keep in step with Payload upgrades: the
  variables are Payload's public theming surface, but a major version can rename
  them. luxury-gardens carries the same cost.
- The mark is a raster drawn as a mask. Sharp at the sizes used here (up to
  about 48px), but it is not a vector; if the designer's SVG arrives, swapping
  the file is the whole change.

## Does it touch POST /join or the members collection?

No. Only the admin's appearance changes. No collection, field, access rule,
route or email changes, and there is no migration.

## Capabilities

### New Capabilities

- `admin-branding`: how the Payload admin presents itself — its marks, its
  palette and type drawn from the site's tokens, its fixed light theme, and its
  tab and share metadata.

### Modified Capabilities

None.

## Impact

- `src/app/(payload)/custom.css` (rewritten), `src/payload.config.ts`
  (`admin.components.graphics`, `admin.meta`), the regenerated import map, and
  two server components in `src/components/admin/`.
- No client JavaScript. No public page changes. `/design-system` is unaffected:
  nothing new is a site component.
