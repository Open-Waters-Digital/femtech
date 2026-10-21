# Proposal

## Why

The navigation has announced "Events (coming soon)" since launch, and the
sign-up copy promises an events schedule in December 2026. There are two kinds
of event to show:

- **Speaking engagements.** Tanya at other organisers' events (Field Service
  Europe, Revive ME, Service Next Medical), which are booked on the organiser's
  site.
- **The network's own events.** Curated events, speakeasies and pitches, which
  need RSVP.

Building this in Payload, rather than connecting Eventbrite or a similar
service, keeps attendees on the same members-shaped data the site already
holds. It also means no per-ticket fees and no second admin, and the team edits
events where they already edit copy.

## What Changes

- **An `events` collection** with two kinds:
  - **Speaking** (an external event). It has the speaker or speakers, their
    role (keynote, panel, talk), the session title or "to be confirmed", the
    organiser's link, the venue and city, and the dates in the event's own time
    zone. There is no RSVP: the card links to the organiser.
  - **Hosted** (the network's own). It has the same details, plus a
    description, an optional image, an optional capacity and an optional RSVP
    closing time.

  Each event is shown publicly only when its status is Published.
- **`/events`** lists upcoming events soonest first, and past events in a
  quieter "Past" list. When nothing is upcoming, it says "Events – coming
  soon." The navigation item becomes a link, "Events".
- **`/events/[slug]`** is for hosted events only: the details and the RSVP
  form. A speaking event has no page of its own.
- **RSVP:** name, email and RSVP. It is saved to a new admin-only
  `event-registrations` collection, one per event per email address. The
  registrant is emailed a confirmation with the event's details and a withdraw
  link. Places are counted against capacity, and RSVP closes when the event is
  full, past or past its closing time.
- **Withdraw:** the link in the email opens a page with a "Withdraw" button.
  Pressing it marks the registration withdrawn and frees the place. A GET never
  changes anything, so mail scanners that follow links cannot withdraw anyone.
- **Cloudflare Turnstile** on the RSVP form, verified by the server, because
  the confirmation goes to a typed address (AGENTS.md backlog: "needs
  Turnstile in front of it first").
- **Seed:** the three speaking engagements as supplied, with the unknowns
  marked "to be confirmed".

### Touches POST /join or members: members, read-only

- `/join` is unchanged.
- **A new public write: `POST /events/[slug]/rsvp`**, with the same layers as
  `/join` (rate limit, honeypot, dwell token, Zod) plus Turnstile. It writes
  with `overrideAccess` only after they pass. No collection gets public
  `create`.
- **A second public write: `POST /events/withdraw`**, authorised only by an
  HMAC-signed token for one registration.
- **Members** are read, never written. A registration is linked to the member
  with the same email if one exists. RSVPing does not add anyone to the members
  list, because that needs the sign-up form's own consent.
- **Failure modes:**
  - **Turnstile is down or unconfigured in production.** RSVP fails closed with
    a "please try again" message, and it is logged as an error.
  - **Resend fails.** The registration stands, the failure is recorded on it,
    and the page still confirms the place. The withdraw link remains in the
    admin for the team to send by hand.
  - **The last place is taken twice.** Counting and saving happen in one
    transaction, under a per-event lock. That is valid with one replica (the
    same constraint as the rate limiter).
  - **A forged or edited withdraw token** is refused, with the same page as an
    expired link, and changes nothing.
- **Privacy effect:**
  - A new list of personal data: names and emails per event.
  - Turnstile, a Cloudflare service, sees the visitor's IP address and browser
    signals on the RSVP page. The privacy notice must name it. It sets no
    tracking cookies.
  - Nothing is logged but the layer and the outcome.
  - The RSVP answer is identical for a new registration and a repeat, so the
    form cannot be used to test who is attending.

## What it costs

- **The first third-party script**, on hosted event pages only. It needs a CSP
  entry when the CSP lands (pre-launch hardening). Two new environment
  variables: `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`.
- **RSVP needs JavaScript**, because Turnstile does. This is the first form on
  the site that does not work without it. Without JavaScript the page says so
  and gives the team's email address instead.
- **A new client component**, `RsvpForm`, for the same reason as `SignupForm`:
  validating in place and showing the confirmation without leaving the page.
  It also mounts the Turnstile widget.
- **An email to strangers' inboxes** is now a thing the site does. Sending
  reputation rests on Turnstile and the rate limit. Resend domain verification
  (delivery item 9) becomes a hard dependency of hosted events.
- **Scope:** two collections, three routes, two migrations' worth of schema,
  and a token scheme with its tests. There are no waitlists, tickets, payments
  or calendar files, and no reminders.
- **No new npm dependency.** Turnstile is a script tag plus one `fetch` to its
  verify endpoint.

## Capabilities

### New Capabilities

- `events-listing`: the events collection's two kinds, `/events`, the hosted
  event page, and what is shown publicly.
- `event-rsvp`: RSVP to a hosted event, capacity and closing, the confirmation
  email, and withdrawing.

### Modified Capabilities

None. No specs exist yet.

## Impact

- New: `src/collections/Events.ts`, `src/collections/EventRegistrations.ts`,
  `src/app/(frontend)/events/` (list, `[slug]`, `[slug]/rsvp/route.ts`,
  `withdraw/`), `src/lib/events/` (schema, queries, withdraw token, Turnstile,
  confirmation email), `src/components/events/` (cards, `RsvpForm`)
- Changed: `components/layout/navigation.ts`, `app/sitemap.ts`,
  `lib/content.ts`, `lib/revalidate.ts`, `scripts/seed.ts`, `env.example`,
  `.railway/railway.ts` (variables), `/design-system`, `AGENTS.md`
- A migration and regenerated `payload-types.ts`
- Independent of `signup-page-copy-and-social-links`. The only overlap is the
  footer's navigation, which reads `NAV_ITEMS` and so picks up the link with no
  change.
