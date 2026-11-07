# Tasks

## 1. Palette and type

- [x] 1.1 Rewrite `src/app/(payload)/custom.css`: import `fonts.css` and `tokens.css` only (no preflight, utilities or `globals.css`), and set, unlayered, Payload's full elevation ramp, success and error ramps, radii and `--font-serif` from tokens with `color-mix()`, plus the `body` rule that emits the shared `--font-body`. Verify the file holds no colour literal, and the built admin stylesheet carries `--color-surface` and `--font-body`.
- [x] 1.2 Measure body text and field help text against the ground at 390px and 1440px; if help text is under 4.5:1, lift that text alone. Record the numbers in design.md.
- [x] 1.3 Tab through the sign-in form and a member's edit view; verify focus is visible on every control, restore any Payload removes, and record any hard-coded Payload colour the variables do not reach.
- [x] 1.4 Verify in the network panel that fonts load only from `/fonts/`, and that a dark-OS editor still sees the light admin.

## 2. Marks and metadata

- [x] 2.1 Add `src/components/admin/AdminLogo.tsx` (the wordmark and the heart mark) and `AdminIcon.tsx` (the mark alone), server components named "FemTech Healthcare Network", with their classes in `custom.css` and the mark as a `currentColor` mask over `/brand/femtech-mark.png`; register them as `admin.components.graphics.Logo`/`Icon` and regenerate and commit the import map. Verify `/admin/login` and the navigation at 390px first, then 1440px: the marks show in ink, no Payload mark, no sideways scroll.
- [x] 2.2 Set `admin.meta.icons` to the site's `/icon.png` and `admin.meta.openGraph` to the network's site name and description. Verify `/admin/login`'s head names the network, carries no `/api/og` image and declares `noindex`.

## 3. Done

- [x] 3.1 Run `pnpm run ci:quality` and report the real output.
- [x] 3.2 Sweep AGENTS.md: the admin's look, the repo tree (`src/components/admin/`), and drop the "change this by hand" note.
