# Design

## Context

- `/join` is the model for a public write. It runs the rate limit
  (`lib/rate-limit.ts`, keyed, in memory, one replica), the honeypot, the dwell
  token (`lib/dwell-token.ts`, HMAC with `PAYLOAD_SECRET`) and Zod, then
  `overrideAccess`, then Resend in `after()` with the result written back.
  RSVP reuses each layer rather than copying it.
- Public pages render per request, and copy is read through `unstable_cache`
  with tags invalidated by hooks (`lib/revalidate.ts`). There is no
  `generateStaticParams`, and the build never reads the database.
- Payload 3.90's `date` field supports `timezone: true`, which stores the IANA
  zone in a sibling field.
- No privacy page, no CSP and no public contact address exist yet.

## Goals / Non-Goals

**Goals:** see the specs. The design boundaries:

- One collection for both kinds of event.
- RSVP that is safe to expose to the public.
- No new npm dependency.

**Non-Goals:**

- Waitlists, tickets or payments.
- `.ics` files, reminders, or emailing the team per RSVP (the admin shows
  counts).
- Editing a registration from the email.
- Recurring events.
- Speaker profiles as their own collection: speakers are names on the event
  until there is a second person to describe.

## Decisions

### One `events` collection with a `kind` discriminator

Fields:

- `title`, and `slug` (unique, derived from the title in `beforeValidate` when
  empty).
- `kind`: `speaking` or `hosted`.
- `status`: `draft`, `published` or `cancelled`.
- `startsAt` and an optional `endsAt`, each with `timezone: true`.
- `allDay`, a checkbox: some engagements are known only by date.
- `venue`, `city` and `country`, plus an `online` checkbox.
- `speakers`, an array of `name` and `role`. The role is `keynote`, `panel`,
  `talk` or `tbc`. The speakers array defaults to one row for Tanya AH Singh.
- `sessionTitle`, optional.
- `organiserUrl`, optional and https. Revive ME has none yet, so a speaking
  card without one is plain text rather than a link.
- `summary`, a textarea.

Hosted-only fields, under `admin.condition`:

- `description` (a textarea split into paragraphs, as the globals are).
- `image` (`media`, optional).
- `capacity` (optional, a positive integer).
- `rsvpClosesAt` (optional).

**Why not two collections:** the listing interleaves both kinds by date, and
one query with one sort is simpler than merging two. **Why `status` rather
than Payload drafts:** drafts add a versions table and an autosave UI for a
four-field record, and "cancelled" is a public state that drafts cannot
express.

### Reads and caching

`lib/events/queries.ts` gets two functions, both wrapped in `unstable_cache`
with a new `events` tag:

- `getPublishedEvents()`: published, sorted by `startsAt`.
- `getHostedEventBySlug(slug)`: published or cancelled.

The upcoming and past split is computed per request from `now`, outside the
cache, so an event moves to Past without anyone saving it. The collection's
`afterChange` and `afterDelete` hooks revalidate the tag.

The confirmed count is **not** cached. It is read per request on the event
page and inside the RSVP transaction, because a cached count shows a full
event as open.

### Dates in the event's zone

The dates are formatted with `Intl.DateTimeFormat('en-GB', { timeZone })`,
using the stored zone and `timeZoneName: 'short'`, in a tested
`formatEventWhen(event)`. It handles a single day, a range within a month
("11–12 November 2026"), a range across months, and all-day events (which show
no time).

### Routes

- `app/(frontend)/events/page.tsx`: the list.
- `app/(frontend)/events/[slug]/page.tsx`: a hosted event only. A speaking
  event or a draft answers `notFound()`.
- `app/(frontend)/events/[slug]/rsvp/route.ts`: `POST` only.
- `app/(frontend)/events/withdraw/page.tsx` and its `route.ts`: the `GET` page
  reads `?token=` and renders the confirm form, and the `POST` route acts.
  `withdraw` is a reserved slug, refused by the slug validator.

### RSVP pipeline (`POST /events/[slug]/rsvp`)

1. `rateLimit('rsvp:' + ip)`.
2. Honeypot `website`.
3. Dwell token.
4. Zod (`lib/events/rsvp-schema.ts`: `firstName`, `lastName` and `email`,
   reusing the sign-up limits).
5. Turnstile verification.
6. Load the event and check it is open.
7. Save inside a transaction.
8. Email in `after()`.

Turnstile comes after Zod because it is the only layer that costs an outbound
call, so the free checks run first.

Only JSON responses: the form needs JavaScript anyway (Turnstile). A request
without `accept: application/json` gets `415`.

### Turnstile

`lib/events/turnstile.ts` exports `verifyTurnstile(token, ip, { fetch,
secret })`. It posts to
`https://challenges.cloudflare.com/turnstile/v0/siteverify` with a 5 s
`AbortSignal.timeout` and returns `pass`, `fail` or `unavailable`. The client
script loads only on hosted event pages, with `async defer` and
`render=explicit`, mounted by `RsvpForm` once it is interactive.

In development and test, without keys, Cloudflare's published always-pass
test keys are used, so the flow can be exercised. In production without keys,
it returns `unavailable` and is logged as an error, which is the same rule as
an unconfigured Resend.

`TURNSTILE_SITE_KEY` is read on the server and passed to the form as a prop,
not exposed as `NEXT_PUBLIC_*`, so the image is not rebuilt per environment.

### Capacity under concurrency

The count and the create (or reactivate) run inside one Payload transaction
(`req.transactionID` via `initTransaction`/`commitTransaction`), behind an
in-process mutex per event ID. The mutex is what makes it correct on the one
replica; the transaction keeps the write atomic. **Alternative:** `SELECT …
FOR UPDATE` on the event row. That is rejected because it would need raw SQL
under Payload's adapter for no gain while `replicas = 1`. It sits with the rate
limiter on the "before raising replicas" hardening item.

### `event-registrations` collection

Fields:

- `event` (relationship).
- `email`, lower-cased by a hook, as on members.
- `firstName` and `lastName`.
- `status`: `confirmed` or `withdrawn`.
- `member` (relationship, optional, set on create when a member has the
  email).
- `confirmation`: `sent`, `failed`, `unconfigured` or `skipped`. Read-only.
- `withdrawnAt`.

There is a compound unique index on `(event, email)`. Access is admin only, as
on `members`.

The event's admin view gets a `ui` field showing "N confirmed of capacity",
plus a join field (`type: 'join'`) listing its registrations. **Repeat RSVP:**
it does not change the stored names. A withdrawn registration is set back to
`confirmed` if there is room, and the confirmation is re-sent either way.

### Withdraw token

`lib/events/withdraw-token.ts` creates a token of the form
`base64url(registrationId).base64url(HMAC-SHA256(PAYLOAD_SECRET,
'withdraw:' + registrationId))`, compared with `timingSafeEqual`. The
`'withdraw:'` prefix separates its domain from the dwell token's, which uses
the same secret.

The token has no expiry of its own: it stops working once the event has ended,
which is checked when it is used. Withdrawing an already withdrawn registration
is a no-op with the same success page. The token never appears in logs, and the
`not valid` page does not say why.

### Confirmation email

`lib/events/confirm.ts` mirrors `lib/signup/notify.ts`, and the shared
`safe`, `plain` and `Send` helpers are moved to `lib/email.ts`. It sends from
`SIGNUP_FROM_EMAIL`, to the registrant only. The subject is "You’re booked:
<title>", with the title passed through `plain`.

The body has the date line from `formatEventWhen`, the venue, and "Can’t make
it? Withdraw" linking to `/events/withdraw?token=…`. There are HTML and text
parts, and a 10 s timeout. The wording is drafted here and listed as copy to
confirm.

### `RsvpForm` (client) and the no-JavaScript path

`RsvpForm` follows the same pattern as `SignupForm`: the same Field
primitives, focus on the first error, and the confirmation in place. The
`<form>` is rendered by the client component only. The server page renders a
`<noscript>` block with the explanation and `siteSettings.contactEmail`, a new
optional field, so no dead button exists without JavaScript.

### Listing UI

`EventCard`, a server component, has one recipe with two variants:

- **speaking:** the whole card is a link to the organiser when one is set, with "Speaking at"
  as the eyebrow, the role, and "Topic to be confirmed".
- **hosted:** it links to the event's page, with the RSVP state as a badge
  (Open, Full or Closed).

It goes on `/design-system` in every variant and state: upcoming, past,
all-day, multi-day, topic TBC, full and cancelled.

## Risks / Trade-offs

- **[Turnstile blocks a real person]** The error says to try again, and the
  noscript and contact address are also a fallback. Turnstile's own interactive
  challenge handles most of these cases.
- **[RSVP needs JavaScript]** Accepted, and stated on the page. It is the price
  of mailing a typed address safely.
- **[Withdraw tokens do not expire before the event]** A forwarded email lets
  the recipient withdraw that person. That is accepted: the harm is one freed
  place, and the token cannot reveal or change anything else.
- **[The confirmation goes to spam]** This depends on delivery item 9 (Resend
  domain, SPF, DKIM and DMARC). No hosted event is published before that is
  done.
- **[Seeded engagements go stale]** Session titles and venues are TBC. They
  are editable in the admin, and the seed never overwrites an existing event
  (it is idempotent per slug).

## Migration Plan

- **The migration:** one additive migration (`events`, `events_speakers`,
  `event_registrations` with its unique index, and
  `site_settings.contact_email`).
- **Configuration:** add the Turnstile variables to `env.example` and
  `.railway/railway.ts`.
- **The seed:** the three speaking events, published:
  - **Field Service Europe 2026:** Amsterdam, panel "Evolving the Service
    Value Proposition to Turn Capability into Scalable Growth", 26 October
    2026, 11:40, Europe/Amsterdam. Organiser URL
    `https://fieldserviceeu.wbresearch.com/speakers/tanya-singh`.
  - **Revive ME Global Longevity & Health Tech Summit:** summary "UAE’s
    Premier Longevity And Health Tech Exhibition & Conference", ADNEC, Abu
    Dhabi, 11–12 November 2026, all day, Asia/Dubai, role TBC. No organiser URL
    until one is supplied (see below).
  - **Service Next Medical 2027:** Westin Carlsbad Resort & Spa, Carlsbad,
    California, 1–3 March 2027, all day, America/Los_Angeles, keynote, topic
    TBC. Organiser URL `https://servicenextmedical.wbresearch.com`.
- **Rollback:** the previous image. The tables are ignored by old code.

## Open Questions

- Revive ME's official URL, and whether Tanya's role there is a keynote, a
  panel or a talk. The dates and venue come from secondary listings, so confirm
  them against the official site.
- The confirmation email's wording, the RSVP page's copy, and the public
  contact address.
- Whether the Webflow-era "Find Latest News" and "Insights and Advice" on the
  home page should point at /events once it exists.
