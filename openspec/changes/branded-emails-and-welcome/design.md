# Design

## Context

Two emails exist today, both built as joined HTML strings over the shared
seam in `lib/email.ts` (`Message`, `Send`, `safe`, `plain`,
`sendWithTimeout`): the team's notification (`lib/signup/notify.ts`) and the
RSVP confirmation (`lib/events/confirm.ts`). Neither has any layout. `/join`
saves the member, answers, then notifies the team in `after()`. Turnstile
exists for RSVP only (`lib/events/turnstile.ts` on the server, a loader inside
`RsvpForm`), and the CSP already allows its origin on every page. The sign-up
page's copy (thank-you, benefits, coming soon) and the social profiles live
in `site-settings` and are read through `lib/content.ts`.

## Goals / Non-Goals

**Goals:**

- One layout function every email goes through, so the next email is branded
  without anyone remembering to make it so.
- The welcome's copy has one source, shared with the page.
- The visitor's answer from `/join` is no slower and no different than today.

**Non-Goals:**

- A welcome for existing members (no backfill).
- Editable email-only copy fields. If the email ever needs to say something
  the page does not, that is a schema change in its own proposal.
- Unsubscribe links. The welcome is a one-off reply to joining, not a list
  email; unsubscribe arrives with the first list email (backlog).
- Dark-mode-specific styling.

## Decisions

### A string-builder layout, not React Email or MJML

`lib/email-layout.ts` exports `renderEmail({ preheader, heading, blocks, footer })`
returning `{ html, text }`. Blocks are a small closed union: `paragraph`,
`list`, `table` (label/value rows, for the team notification), `button`,
`divider` (the sparkle), `smallprint`. Each block renders to an HTML fragment
and a text fragment from the same data, so the two parts cannot drift. Every
string a block receives is escaped inside the block renderer, not by callers,
so escaping is no longer something each email can forget.

Alternatives: React Email gives JSX components and a preview server, but adds a
dependency tree and a second rendering model for three short emails. MJML
needs a compile step and a large package. Both are worth revisiting if the
site starts sending list emails; the block union is easy to port.

### Mail-client-safe markup

A 600px max-width centred table on the cream ground, `role="presentation"`,
every style inline, no `<style>` block relied on (a small one for the
phone-width padding is progressive only). Headings
`Georgia, 'Times New Roman', serif`; body `'Helvetica Neue', Helvetica, Arial, sans-serif`.
`<meta name="color-scheme" content="light">` and `supported-color-schemes`
to discourage forced inversion. A hidden preheader span sets the inbox
preview line. The button is a bulletproof table cell (ink ground, cream
label), not an image.

### Colours from one exempt file

`lib/brand-constants.ts` gains an `EMAIL_COLOURS` object (surface, sunken,
text, muted, line, ornament, inverse), each with the token it mirrors in a
comment. That file is already the one exemption from the hex rule for exactly
this reason (places that cannot read a CSS variable). A unit test asserts each
value equals the matching `--color-*` in `tokens.css`, so they cannot drift.

### The mark from the site's own URL

`<img src="${siteUrl()}/brand/femtech-mark.png" width="40" height="42" alt="FemTech Healthcare Network">`,
linked to `siteUrl()`. No attachment or data URI (Gmail strips data URIs; CID
attachments inflate every send). The PNG is 58×61, so it is slightly soft on
a high-density screen at 40px; the vector mark is already an open question.

### The sparkle as a character

The divider is `✦` (U+2726) in the ornament colour between two hairlines, so
it survives images being blocked and needs no asset.

### Welcome content is passed in, not read inside

`lib/signup/welcome.ts` exports a pure `buildWelcome(member, content, options)`
and `sendWelcome(...)`, mirroring `notify.ts`. `content` is the slice of
site settings it needs (`thanksHeading`, `thanks`, benefits heading, intro and
items, coming-soon heading and body, LinkedIn URL, `contactEmail`), read in the
route's `after()` through `lib/content.ts`, so it is cached and invalidated by
the global's existing hook. The subject is the thank-you heading with its
final full stop removed ("Welcome to FemTech Healthcare Network"), falling back
to that literal if the heading is empty. Paragraphs split on blank lines with
`lib/text.ts`, as on the page.

### Turnstile verified in `after()`, gating only the welcome

The check's outcome does not change the response, so there is no reason to
make the visitor wait for Cloudflare. `/join` reads `cf-turnstile-response`
from the form data (the widget writes that hidden input into the form, so the
existing `FormData` post carries it with no client change to the payload) and
hands it, with the client IP, to `after()`:

```
after:
  repeat?            → welcome = not sent (repeat)        → notify team
  verifyTurnstile    → pass | fail | unavailable
  pass               → sendWelcome → sent | failed | unconfigured | skipped
  fail / no token    → welcome = unverified
  unavailable        → welcome = unverified, log [join] turnstile unavailable
  notifyTeam(member, repeat, welcomeOutcome)
  record notification and welcomeEmail on the member (one update)
```

Welcome first, then the team, so the team's email states the real outcome.
Both sends have their own timeouts (10 s welcome, 8 s team), so `after()` is
bounded at about 23 s with the 5 s verification.

Alternative considered: verify before saving and refuse a failed check, as
RSVP does. Rejected: it would break the form without JavaScript, which it has
always supported, and refuse real people whose browsers block Cloudflare. The
thing Turnstile protects here is the outbound email, so that is all it gates.

### Shared Turnstile modules

`lib/events/turnstile.ts` moves to `lib/turnstile.ts` (imports updated; its
tests move with it). The script loader and the "render when on screen" logic
move out of `RsvpForm` into `components/turnstile/useTurnstile.ts`, a hook
both forms call: `{ containerRef, state: 'idle' | 'ready' | 'solved' | 'unavailable', reset }`.
`SignupForm` blocks submit only in `ready` (rendered, not yet solved); in
`unavailable` it submits without a token. `RsvpForm` keeps its stricter rule
(no token, no RSVP). No new client component: a hook inside two existing ones.

The sign-up page passes `turnstileConfig()?.siteKey ?? null` to the form as a
prop, as the event page does. With no site key, the form shows no widget and
every sign-up records `unverified`.

### Member field

`welcomeEmail`, a select (`sent`, `failed`, `unconfigured`, `unverified`,
`skipped`), sidebar, read-only, labelled "Welcome email". There is no
`repeat` value: a repeat never touches the row. One additive migration: a nullable enum
column. Existing rows stay empty.

### Showcase

A server-rendered "Emails" section on `/design-system`, for reference only:
each email (team notification, RSVP confirmation, welcome) built by its real
builder from placeholder fixtures in `lib/email-fixtures.ts`, its HTML shown
in `<iframe srcDoc sandbox>` at 390px and 640px. Placeholder copy is fine; the
point is the layout and type. No `allow-scripts`. If the sandboxed frame's
inherited CSP blocks the mark, add `allow-same-origin` (still no scripts); the
content is our own fixture either way.

### `/design-system` local only

The page calls `notFound()` unless `siteEnv() === 'development'`, before
rendering anything, so production and preview answer with the site's 404.
`siteEnv()` reads `SITE_ENV`, which is `development` when unset, so a local
`pnpm build && pnpm start` still shows it (the definition of done checks a
running build) while every Railway environment, which sets `SITE_ENV`, does
not. Its `robots.txt` disallow stays, harmlessly.

Alternative: a check in `proxy.ts`. Rejected: one more path list to keep in
step, for one page that can refuse itself.

## Risks / Trade-offs

- [Brand colours copied into TypeScript drift from `tokens.css`] → a test
  compares them.
- [Outlook desktop ignores some CSS (rounded corners, max-width)] → layout is
  tables with fixed widths; rounded corners are decoration only. Checked in a
  real Gmail and Outlook inbox during apply.
- [Forced dark mode inverts the cream] → `color-scheme: light`; accept that
  some clients invert anyway. The text stays legible either way since it is
  ink on cream.
- [Turnstile keys absent in production means nobody is welcomed] → logged as
  an error on every sign-up and visible per member as "not verified". The keys
  are already a pre-launch hardening item.
- [A bot passes Turnstile and gets one welcome sent per new address] → one
  email per address, ever, plus the per-IP rate limit. That is the same
  exposure RSVP already accepts.
- [A Railway environment without `SITE_ENV` would read as development and
  show `/design-system`] → after deploying, check `/design-system` answers 404
  on production (task 7.3).
- [`after()` work lost if the container stops mid-send] → the member is saved;
  the field stays empty, which reads as "unknown" in the admin. Unchanged from
  today's team notification.
- [The welcome's subject and footer wording are written here, not supplied] →
  listed under Open questions in AGENTS.md, as the other written-here copy is.

## Migration Plan

1. Deploy: pre-deploy runs the additive migration; the old container ignores
   the new column.
2. Enter the LinkedIn profile in production (Site settings → Social profiles).
3. Confirm `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` are set in Railway
   and the widget's hostnames include `www.femtechhealth.com`.
4. Check `/design-system` answers 404 on production.
5. Sign up with a fresh address on production; read the welcome and the
   team's email in real inboxes (Gmail and Outlook).

Rollback: redeploy the previous image. The column stays and is ignored.

