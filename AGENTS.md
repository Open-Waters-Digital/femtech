# femtechhealth.com

The website of FemTech Healthcare Network, rebuilt from Webflow as a Payload
CMS site on Railway. Three public pages, a members list that the sign-up form
writes to, and an email to the team for every sign-up.

**Spec-driven.** Any new route, collection, field, client component or design
token goes through an OpenSpec proposal first (see "Working with OpenSpec").
Bug fixes, copy changes and dependency bumps do not.

## Implementation status legend

| Mark | Meaning                                                      |
| ---- | ------------------------------------------------------------ |
| ✅   | Implemented, and verified against a running build            |
| 🟡   | Planned for launch: non-negotiable                           |
| 🔵   | Post-launch backlog: explicitly out of scope for now         |
| 🧪   | To be confirmed: a decision is needed before it is built     |
| 🧱   | Pre-launch hardening: must exist before the domain cuts over |

## Product context

- **Who it is for.** Women in healthcare technology: clinicians, founders,
  executives, innovators, investors and people starting out. The network's
  co-founder and CEO is Tanya AH Singh.
- **The conversion.** Signing up. Every page leads to `/sign-up`.
- **What it replaces.** A Webflow site at https://www.femtechhealth.com, built
  on a template ("Kaleo"). The export is beside this repo at
  `femtech-9ce3f2.webflow/` (gitignored) for reference. Its live sections were
  the hero, "Coming soon" and "Made by women, for women"; the template's other
  sections were hidden and are not carried over.
- **What it is not, yet.** There are no member accounts and no member-facing
  features. The members collection is an email list that is expected to grow
  (see the backlog), so it is modelled as people rather than as form
  submissions.

## Feature scope

### Home `/`

- ✅ **Hero.** A framed, full-height background video with the mark, the
  `femtech` wordmark at 17vw and the introduction, and "Discover" at the foot,
  as on Webflow. The poster is the LCP image; the video fades in over it once
  playing, never starts for prefers-reduced-motion, and has a pause control
  (WCAG 2.2.2, which Webflow lacked). `components/home/Hero.tsx`, `HeroVideo.tsx`.
- ✅ **Coming soon.** The statement pinned while three photographs rise one
  over the next, in every browser. Without JavaScript, or under reduced motion,
  the photographs sit stacked and the section is not pinned.
  `components/home/ComingSoon.tsx`, `styles/components.css`.
- ✅ **Made by women, for women.** A centred statement and two photograph
  cards with their copy at the foot. `components/home/Community.tsx`.
- ✅ **Webflow's motion, all of it.** Taken from the IX3 interaction data in
  the export's `webflow.js` (targets, timings, distances, angles) and rebuilt
  with the text split on the server (`SplitText`). Load and hover motion is
  CSS. Scroll-linked motion is `ScrollProgress`, a small client controller that
  writes `--scroll-progress` with Webflow's scrub glide, the same shape as
  luxury-gardens' `StatementPinController`. CSS scroll-driven animation was
  tried first and dropped on 19 October 2026: Firefox does not run it, and it
  cannot express the glide. Measured against the live site every 300px of
  scroll, in Chromium and Firefox, to within a few pixels:
  - on load: the wordmark letter by letter from 0.3s, the introduction word by
    word from 0.77s, the mark popping in at 1.9s, the header dropping in at 2s
    (home only; Webflow did it on every page), "Discover" rising at 2.89s
  - the hero receding to 90% as it scrolls away
  - all three photographs rising from 140vh, turning from ±40° to rest, over
    Webflow's ranges of the pinned track
  - each centred statement fading in word by word the first time it enters the
    screen (`RevealObserver`, the one piece of JavaScript); the about page's
    two large statements do the same
  - buttons rolling their label word by word with the sparkle turning 180°;
    nav links rolling letter by letter
  - Motion is added only under `prefers-reduced-motion: no-preference`;
    `ScrollProgress` does nothing under reduced motion.

### About `/about-us`

- ✅ New copy (supplied 2026-10-19), laid out after luxury-gardens' about page:
  large Zodiak statements with room around them. Sage opening band, mission,
  why we exist, what we do (numbered rows), what we stand for (the one dark
  band), the founder, and a closing sign-up band.
  `components/about/AboutSections.tsx`.
- ✅ **Founder photograph.** The Nasdaq billboard photograph, as a stopgap; a
  better image is expected. Replace it in the admin (About page → Founder).
- 🧪 **"Connect on LinkedIn".** The button renders only once the profile URL is
  entered in the admin. The URL has not been supplied.

### Sign-up `/sign-up`

- ✅ The client's copy (supplied 2026-10-20): "Become a Member. It’s free.",
  what membership means (five benefits), coming soon, and the form under
  "Join the Network". All of it is in the admin (Site settings → Sign-up page);
  a section an editor empties is not drawn.
- ✅ First name, last name, email, job title, industry (one of ten) and the
  updates checkbox are required; phone and organisation are optional. The
  checkbox is required because the client's copy marks it so: see Open
  questions. The Webflow form's message field is gone; `message` stays on
  members for anything already saved.
- ✅ Required fields are not asterisked: optional ones say "(optional)", the
  site's convention. The client's copy used asterisks (Open questions).
- ✅ "We’ll only use your details…" under the button. "See our Privacy Policy."
  follows once `PRIVACY_PATH` is set (delivery item 10); until then there is no
  link to a page that does not exist.
- ✅ The thank-you heading and message are editable, and end with "follow us on
  LinkedIn" once a LinkedIn profile is set under Social profiles.
  `components/signup/SignupThanks.tsx`, shared by the form and
  `/sign-up/thank-you`.
- ✅ Works without JavaScript (a native post, answered with `/sign-up/thank-you`
  or `/sign-up/not-sent?reason=…`). With JavaScript it validates in place,
  focuses the first invalid field, and shows the confirmation without leaving
  the page.
- ✅ Saved to the **members** collection, then the team is emailed through
  Resend, after the response. See "The sign-up path".

### The site

- ✅ Header (over the page, not fixed, as on Webflow), mobile menu, footer with
  the wordmark lockup over a rule, the invitation, the navigation and the
  copyright line (after luxury-gardens; Webflow set the wordmark full width).
- ✅ **Social profiles** (LinkedIn, Instagram, Facebook, X), set in Site
  settings → Social profiles, each URL checked against its platform's host
  (`lib/social.ts`). Shown as marks at the end of the footer's copyright line;
  nothing is drawn while there are none. After luxury-gardens' `SocialLinks`.
- ✅ "Events (coming soon)" is text, not a link. Webflow linked it to `#`.
- ✅ Redirects from the Webflow URLs: `/contact` → `/sign-up` (308), and the
  `.html` forms of each page.
- ✅ `robots.txt` (disallow all outside production), `sitemap.xml`, canonical
  per page, per-page titles and descriptions; `/design-system` and the sign-up
  outcome pages are `noindex`.
- ✅ The site's own 404 for any unmatched URL (`(frontend)/[...missing]`).
- 🟡 Analytics. See "Delivery order".

## Delivery order

Locked. Revisit only if a dependency changes.

1. ✅ Toolchain, quality gate, Payload and Postgres, migrations.
2. ✅ Design tokens from the Webflow CSS, primitives, `/design-system`.
3. ✅ Collections and globals, seed with all current copy and assets.
4. ✅ Chrome: header, mobile menu, footer.
5. ✅ Home page.
6. ✅ About page.
7. ✅ Sign-up: form, `/join`, members, Resend notification (code; unsent, see 9).
8. 🟡 Railway: create the GitHub repo, the project, Postgres, a bucket and the
   service; apply `.railway/railway.ts`; seed production; check the deployment
   manifest shows the pre-deploy command and the health check.
9. 🟡 Resend: verify the sending domain, set the three variables, send a real
   test sign-up and read the email in a real inbox.
10. 🟡 Privacy page, from the client's wording (see Open questions). Needed
    before the form collects real data, and before analytics.
11. 🟡 Analytics, following the `openwaters-analytics` skill: the client's
    PostHog organisation, `@open-waters-digital/analytics` with
    `lead_submitted` from `/join`, the `data-page-type`, `data-cta` and
    `data-form-id` markup, and the objection control on the privacy page.
12. 🧱 Pre-launch hardening, then the domain cuts over.

## Post-launch backlog

- 🔵 **Members export.** A CSV download from the admin, so the list can go
  into a mailing tool. Payload's import/export plugin is the likely route.
- 🔵 **Welcome email to the member.** Deliberately not sent today: an email to
  the typed address turns the form into a way to send mail to strangers, and
  needs Turnstile in front of it first.
- 🔵 **Unsubscribe.** `status` exists on members; a public unsubscribe link
  arrives with the first email sent to members.
- 🔵 **Events.** The nav already announces it. Likely a collection and a page.
- 🔵 **Member accounts.** Profiles, sign-in, a directory. The reason members
  are people rather than submissions.

## Repo overview

```
src/
  app/
    (frontend)/            the public site; layout.tsx is its root document
      page.tsx             home
      about-us/            about
      sign-up/             form, thank-you, not-sent
      join/route.ts        POST /join: the only public write. Start here for sign-up
      join/token/          a fresh dwell token for a form left open too long
      design-system/       the showcase (noindex)
      [...missing]/        sends unmatched URLs to not-found.tsx
      health/              liveness probe for Docker and Railway
    (payload)/             Payload's admin and API (generated; custom.css is ours)
    robots.ts, sitemap.ts  must sit at the app root to be picked up
  collections/             Members, Media, Videos, Users
  globals/                 Home, About, SiteSettings: all page copy
  components/
    primitives/            Button, Heading, Text, Eyebrow, Field (and
                           CheckboxField), Container,
                           Section, Paragraphs, PayloadImage, Sparkle, SmartLink,
                           SplitText, RollingLabel
    layout/                SiteHeader, MobileMenu, SiteFooter, RevealObserver,
                           ScrollProgress, navigation.ts
    social/                SocialLinks, SocialMark (Simple Icons paths, CC0)
    home/, about/, signup/ page sections
  lib/
    content.ts             every read the public pages make
    signup/                schema (shared by form and server, with the
                           industry list), notify (Resend)
    social.ts              platforms, labels and the profile URL check
    dwell-token.ts, rate-limit.ts   sign-up defences
    scroll-progress.ts     scroll ranges and the scrub glide, for ScrollProgress
    revalidate.ts, uploads.ts, storage.ts, site-env.ts, text.ts
  styles/
    tokens.css             start here for anything visual
    variants.ts            one style recipe per primitive
    components.css         all motion: rolling labels, the opening, the hero
                           receding, reveals, the pinned photographs
  migrations/              generated, committed, applied by Railway pre-deploy
scripts/
  seed.ts                  idempotent seed: admin, assets, all copy
  seed-assets/             the images and video the seed uploads
public/fonts, public/brand Zodiak, Cabinet Grotesk, the mark
.railway/railway.ts        Railway service config (NOT applied on push)
```

## Tech stack

| Concern         | Choice                                                   | Status             |
| --------------- | -------------------------------------------------------- | ------------------ |
| Language        | TypeScript strict, `noUncheckedIndexedAccess`            | ✅                 |
| Framework       | Next.js 16.3 App Router, React 19                        | ✅                 |
| CMS             | Payload 3.90.1, admin at `/admin`                        | ✅                 |
| Database        | Postgres 17; local on port 5435 via `compose.yaml`       | ✅                 |
| Media           | Railway S3 bucket in deployed environments; disk locally | ✅                 |
| Styling         | Tailwind v4, tokens in `src/styles/tokens.css`           | ✅                 |
| Validation      | Zod, one schema for the form and the server              | ✅                 |
| Email           | Resend                                                   | ✅ code, 🟡 config |
| Tests           | Vitest (unit)                                            | ✅                 |
| Package manager | pnpm 11.5.2, Node 24.20.0                                | ✅                 |
| Deploy          | Railway, Dockerfile, `.railway/railway.ts`               | 🟡                 |
| Analytics       | PostHog via `@open-waters-digital/analytics`             | 🟡                 |
| Error tracking  | None yet                                                 | 🧱                 |

Same versions as fionacorbett and luxury-gardens on purpose: one set of
Payload behaviours to know, and fixes travel between the repos.

### Rendering: per request, and why

Every public page renders on each request, reading its copy through
`unstable_cache` (`lib/content.ts`), which the globals' hooks invalidate. The
siblings prerender instead, which means their builds read the database: they
need Postgres's public URL as a build argument and a migration inside the
build, because Railway's private network does not exist during a build.

Rendering per request deletes all of that. The build never opens a database
connection (CI builds the image with none available), migrations run once in
pre-deploy, and an editor's save is live on the next request. The cost is a
server render per visit, a few milliseconds for a cache hit. **What would undo
it:** making a public page static, or adding `generateStaticParams` that reads
Payload. If a page ever needs to be static, read the siblings' Dockerfiles
first.

### Why Payload

The team edits copy and images without a deploy, and the members list needs an
admin to read, correct and add to. Payload provides both, plus auth for the
admin, without hand-building any of it.

## Schema and data-layer conventions

- **Collections:** `members` (personal data, admin only), `media` (images, alt
  text required, exact mime types, no SVG), `videos` (the hero video, never
  given to next/image), `users` (admin accounts).
- **Globals:** `home`, `about`, `site-settings`. Plain textareas, split into
  paragraphs on blank lines (`lib/text.ts`). No rich text, so the design cannot
  be overridden from the admin.
- **Migrations:** `pnpm run migrate:create <name>`, committed, applied by
  Railway's pre-deploy (`node_modules/.bin/payload migrate`). `push: false`.
  Additive only: the new schema is live while the old container still serves.
- **Uploads:** a collection with an `upload` block must be in
  `UPLOAD_COLLECTIONS` in `lib/uploads.ts` (a test fails otherwise). Image
  collections also go in `IMAGE_UPLOAD_COLLECTIONS`, which feeds
  `images.localPatterns`.
- **Storage plugin** registered in every environment and enabled only with a
  bucket (`lib/storage.ts`), so the schema is identical everywhere.
- **Reads** go through `lib/content.ts`: Local API, no user, `depth: 1`.
- **Seed** (`pnpm run seed`) is idempotent per step, never overwrites a global
  that has content (`SEED_OVERWRITE=1` forces it), and is never part of a
  deploy.

## The sign-up path

`POST /join` (`app/(frontend)/join/route.ts`), cheapest check first:

1. Per-IP rate limit, five per ten minutes, in memory (hence one replica).
2. Honeypot field `website`.
3. HMAC-signed dwell token (`PAYLOAD_SECRET`), minted into the page as it
   renders, so the form works without JavaScript. At least 3 s, at most 2 h.
4. Zod (`lib/signup/schema.ts`), the same schema the form runs.
5. Save. One row per lower-cased email. A repeat sign-up **does not overwrite**
   the existing row: an anonymous request must not be able to change someone
   else's details by typing their address. The team is told it was a repeat.
6. Notify the team through Resend, in `after()`, once the visitor has their
   answer. The result is written to the member's `notification` field. An
   unconfigured or failed send in production is logged as an error.

Bot rejections answer exactly as success does. A visitor who was already a
member gets the same answer as a new one, so the form cannot be used to test
who is on the list. The notification goes only to `SIGNUP_NOTIFY_EMAIL`, never
to the typed address, which is why there is no CAPTCHA (see the backlog).

## Engineering standards

### Rendering and performance

- Server components by default. The client components are `MobileMenu`,
  `HeroVideo`, `SignupForm`, `RevealObserver` and `ScrollProgress`; a new one
  needs a reason in its proposal.
- Motion is CSS for load and hover. Scroll-linked motion goes through
  `ScrollProgress` (maths in `lib/scroll-progress.ts`, tested), not CSS
  `animation-timeline`, which Firefox does not run. Text to animate is split on the server
  with `SplitText`. Letter-split text is hidden from assistive technology and
  given whole once (`RollingLabel`, the hero's `aria-label`), or it is
  announced letter by letter.
- Every CMS image goes through `PayloadImage` (dimensions from the document,
  focal point honoured). Only the hero poster is `preload`.
- No third-party script on any page until analytics, which loads after the
  page is interactive.

### Types

- No `any`, no non-null assertions (both ESLint errors). Validate at the
  boundary (Zod, Payload's field validation) and trust the types inside.
- `src/payload-types.ts` is generated: run `pnpm run generate:types` after a
  schema change. CI fails on a stale file.

### Server routes are security boundaries

- Re-validate everything with the shared schema; never trust the form's own
  check.
- Public writes go through a route that writes with `overrideAccess: true`
  after its layers have run. No collection gets public `create`.
- Every outbound call has a timeout. Fail closed.
- Generic errors to the client; the layer and the outcome to the logs.
- **Never log** a name, email, phone number or message, from any route.

### Testing

The sign-up path is the critical path: the schema, the notification (escaping,
header injection, timeouts, unconfigured production), the dwell token and the
rate limiter all have failure-mode tests. A change to `/join` adds tests for
what it changes.

### Dependencies

Each addition needs a reason in its proposal; anything reaching the client
bundle needs a strong one. Lockfile committed; CI installs frozen.

## Design system and UI standards

- **The ethos** is the Webflow site's: warm cream ground, near-black ink, the
  sand sparkle as the only ornament, Zodiak for statements and Cabinet Grotesk
  for reading, generous space. The about page adds the sage from Webflow's
  about page. Values are lifted exactly from the Webflow CSS; derived values
  say so in `tokens.css`, with measured contrast ratios.
- **Tokens only.** Feature code never uses a literal colour; ESLint's
  `no-restricted-syntax` rule fails on a hex in `src/**` (exempt: `styles/`,
  `lib/brand-constants.ts`, the showcase). Avoid arbitrary-value utilities; the
  few that remain carry Webflow's viewport-relative measurements.
- **Mobile first.** Base styles are the phone; `md:` and `lg:` upward. A
  `max-*:` utility is a bug.
- **One recipe per primitive** in `styles/variants.ts`, as complete literal
  class strings (a test fails on a template-built class).
- **The showcase.** A component is not done until it is on `/design-system`
  with every variant, size and state, in the same change.
- **Dark grounds** use the `ground-dark` utility (through `Section tone` or
  directly), which swaps the focus ring to cream.
- **Copy:** British English, sentence case for UI, the client's own copy
  verbatim, curly apostrophes.

## Working with OpenSpec

`/opsx:propose "…"` starts a change; apply it in a separate turn after the
proposal is approved. Project rules are in `openspec/config.yaml`. The files in
`.claude/` and `.agents/` are generated by `openspec init`; do not hand-edit
them. Bug fixes, copy changes, dependency bumps and tests for existing
behaviour skip the proposal.

## Commits

Conventional Commits, first line only: `<type>(<scope>): <description>`.
Types: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `build`, `ci`,
`chore`, `copy`. Scopes: `home`, `about`, `signup`, `members`, `chrome`,
`design-system`, `cms`, `deploy`. The body carries the reasoning.

## Definition of done

1. `pnpm run ci:quality` passes, and the real output is reported, failures
   included.
2. The change is checked at 390px wide first, then at desktop, in a running
   build.
3. New or changed primitives are on `/design-system` with every variant and
   state.
4. No new hex literal or magic value in feature code.
5. The keyboard path works, with a visible focus ring on every ground.
6. New logic has tests, including its failure modes.
7. Any new client JavaScript is justified in the proposal.
8. A schema change has a committed migration and regenerated types.
9. OpenSpec tasks are ticked and the change archived.
10. This file is swept.

## Privacy and compliance

- **Collected:** first name, last name, email, job title, industry, optional
  phone, optional organisation, agreement to updates (required on the form),
  and when they signed up. No message since 2026-10-20; older rows may hold
  one. Stored in Postgres on
  Railway, shown only in the admin, and sent to the team by email through
  Resend.
- **Not collected:** no cookies, no tracking, no analytics until delivery
  item 11.
- **Retention:** not decided (Open questions).
- **Never:** email members who have not ticked the checkbox; log personal data;
  send form contents to analytics; give `members` public read or create.

## Pre-launch hardening

- 🧱 **Privacy page**, from the client's wording, linked beside the form. The
  form collects personal data, and analytics needs the objection control.
- 🧱 **Email deliverability.** Resend domain with SPF, DKIM and DMARC, checked
  against a real inbox. A notification in spam is a lost sign-up.
- 🧱 **Error tracking with alerting.** A silently broken form is a silently
  lost list. At minimum, alert on `[join]` errors in the Railway logs.
- 🧱 **Security headers and a CSP**, including the analytics proxy host.
- 🧱 **A shared-store rate limit** before raising `replicas` above one.
- 🧱 **An OG image.** None is set, so a shared link has no preview image.
- 🧱 **Search Console and Bing Webmaster Tools**, domain property verified by
  DNS before the domain cuts over, per `openwaters-analytics`.
- 🧱 **Accessibility audit** of the three pages, and a Lighthouse check.
- 🧱 **WOFF2 fonts** (see Open questions). The TTFs are about 180 KB together.
- 🧱 **Backups.** Confirm Railway Postgres backups are on: this is the only
  copy of the members list.

## Open questions

- 🧪 **Domain.** Assumed `https://www.femtechhealth.com` is canonical, with the
  apex redirecting to it (the Webflow site serves `www`). Set
  `NEXT_PUBLIC_SITE_URL` accordingly.
- 🧪 **Railway project and GitHub repo.** `.railway/railway.ts` assumes the
  repo `Open-Waters-Digital/femtech` on `main` and a project named
  `femtechhealth.com`. Neither exists yet.
- 🧪 **Who is emailed about sign-ups** (`SIGNUP_NOTIFY_EMAIL`), and the sending
  address and domain (`SIGNUP_FROM_EMAIL`).
- 🧪 **Tanya's LinkedIn URL**, for the about page.
- 🧪 **A better founder photograph.** The billboard photograph is a stopgap.
- 🧪 **Privacy notice wording, retention period and lawful basis** for the
  members list. Take them from the client or their adviser; do not draft legal
  copy.
- 🧪 **Sign-up copy written here, not supplied:** the field error messages and
  the not-sent messages, in code.
- 🧪 **The required updates checkbox.** The client's copy makes it a condition
  of joining. Under UK GDPR, consent that is a condition of a service is
  generally not freely given unless membership _is_ the updates. The client or
  their adviser must confirm before launch; making it optional again is one
  line in `lib/signup/schema.ts` and the label.
- 🧪 **Asterisks.** The client's copy marks required fields with `*`; the site
  marks optional ones instead. Confirm, or flip it in `Field`.
- 🧪 **The network's LinkedIn URL** (and any other profiles), for the footer and
  the thank-you message. Enter in Site settings → Social profiles.
- 🧪 **"December 2026"** in the sign-up copy will go stale. Editable in the
  admin.
- 🧪 **Brand name.** The site uses "femtech" as the wordmark, "Femtech" in the
  home copy and the copyright line (as on Webflow), and "FemTech Healthcare
  Network" in the about copy and the page titles. Confirm which the copyright
  and titles should use.
- 🧪 **Font licence.** Zodiak and Cabinet Grotesk are Fontshare faces (ITF Free
  Font License), served as the TTFs from the Webflow export. Check the licence
  and replace them with Fontshare's official WOFF2 files.
- 🧪 **The mark** is a 58×61 PNG from Webflow, shown at up to 64px. A vector
  version would be sharper.
- 🧪 **Analytics tier** (Essentials, Insights or Growth) and who owns the
  PostHog organisation.
- 🧪 **Webflow template copy.** "Insights and Advice" and "Find Latest News" on
  the home page describe features the site does not have yet. Carried over
  unchanged, because the brief was to rebuild the home page as it is.

## Maintaining this document

This file is the source of truth for the project. Sweep it after every shipped
change: flip statuses, update the delivery order, refresh the repo tree, and
remove answered questions. A document describing a system that no longer
exists is worse than none, because it is trusted.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
