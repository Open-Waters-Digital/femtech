# Tasks

## 1. Events and the listing

- [x] 1.1 Add `collections/Events.ts` (fields per design, slug derivation and the reserved `withdraw` slug, https check on `organiserUrl`, hosted-only fields under `admin.condition`, revalidation hooks for a new `events` cache tag), register it, create the migration and regenerate types; verify with unit tests for slug derivation, the reserved slug and the URL check, and by creating each kind in the admin
- [x] 1.2 Add `lib/events/format.ts` with `formatEventWhen` and the upcoming/past split; verify with tests for a single day, a same-month range, a cross-month range, all-day, Europe/Amsterdam shown as CET while the server runs in UTC, and an event moving to past at its end
- [x] 1.3 Add `lib/events/queries.ts` (`getPublishedEvents`, `getHostedEventBySlug`, cached under the `events` tag); verify that draft events are excluded and that a save in the admin shows on the next request
- [x] 1.4 Add `components/events/EventCard.tsx` (speaking with and without an organiser link, hosted with Open/Full/Closed, past, cancelled, topic TBC, multi-day, all-day), with its recipe in `styles/variants.ts`, and add every variant and state to `/design-system`; verify the keyboard path and the focus ring on cream and dark grounds
- [x] 1.5 Add `app/(frontend)/events/page.tsx` (upcoming, "Past events", the empty "Events – coming soon." state with a sign-up link, title, description and canonical); change `NAV_ITEMS` to link "Events" to `/events` and add `/events` to the sitemap; verify at 390px then desktop, and `aria-current` on `/events`
- [x] 1.6 Seed the three speaking engagements (idempotent per slug, published, details per design); verify `/events` on a fresh seed lists them in date order with the right local times

## 2. Hosted event pages

- [x] 2.1 Add `app/(frontend)/events/[slug]/page.tsx` (hosted only; cancelled says so; `notFound()` for speaking or draft; metadata and canonical; description paragraphs; image through `PayloadImage`), with upcoming hosted events added to the sitemap; verify with a hosted event created in the admin, and 404s for a draft and for a speaking event's slug
- [x] 2.2 Add `contactEmail` to `SiteSettings` (optional, migration and types) and the page's RSVP state from an uncached confirmed count (open, full, closed, not yet open to the public); verify each state renders with the right message and no form when closed

## 3. RSVP

- [x] 3.1 Add `collections/EventRegistrations.ts` (admin-only access, email lower-casing, compound unique index on event and email, status, member link, confirmation, withdrawnAt), the join field and the "N confirmed of capacity" UI on events, the migration and types; verify with an access test that anonymous REST and GraphQL reads are refused, and that the unique index rejects a duplicate
- [x] 3.2 Move `safe`, `plain` and `Send` from `lib/signup/notify.ts` to `lib/email.ts` with no behaviour change; verify that `notify.test.ts` passes unchanged
- [x] 3.3 Add `lib/events/turnstile.ts` (`pass`/`fail`/`unavailable`, 5 s timeout, test keys outside production, fails closed in production without a secret) and the variables in `env.example` and `.railway/railway.ts`; verify with tests for pass, fail, timeout, a non-200 answer and an unconfigured production
- [x] 3.4 Add `lib/events/withdraw-token.ts` (domain-separated HMAC, `timingSafeEqual`); verify with tests for round-trip, tampered ID, tampered signature, another secret, a dwell token presented as a withdraw token, and malformed input
- [x] 3.5 Add `lib/events/rsvp-schema.ts` and `POST /events/[slug]/rsvp` (layers in the design's order, open check, per-event mutex and transaction, repeat and reactivate rules, member link, JSON only); verify with route tests for every layer's rejection, a full event, a closed event, a cancelled event, a repeat that changes nothing, a reactivation, and two concurrent requests for the last place confirming exactly one
- [x] 3.6 Add `lib/events/confirm.ts` (registrant only, HTML and text, escaped values, subject without line breaks, 10 s timeout, result written to `confirmation` in `after()`); verify with tests for escaping, header injection, timeout, unconfigured production, and that the withdraw link carries a valid token
- [x] 3.7 Add the client component `RsvpForm` (Field primitives, Turnstile mounted explicitly, focus on the first error, confirmation in place) and the `<noscript>` block with `contactEmail`; add the form's states (editing, error, sending, confirmed, Turnstile failed) to `/design-system`; verify in a running build at 390px then desktop with the Turnstile test keys, and with JavaScript disabled

## 4. Withdraw

- [x] 4.1 Add `app/(frontend)/events/withdraw/page.tsx` (GET shows the event and a Withdraw button, or "not valid", or "already passed"; noindex) and its `POST` route (marks withdrawn, sets `withdrawnAt`, idempotent); verify with tests that GET changes nothing and that a tampered token changes nothing, and by withdrawing from a real confirmation email locally and seeing the place freed on the event page

## 5. Integration and documentation

- [x] 5.1 Sweep `AGENTS.md`: Events in the feature scope and the delivery order, the repo tree, the client components list (`RsvpForm`), the RSVP path beside the sign-up path, privacy (registrations, Turnstile), the pre-launch hardening (Turnstile host in the CSP; the per-event mutex under "before raising replicas"), the backlog (welcome email now unblocked by Turnstile), and the open questions from the design
- [x] 5.2 Run `pnpm run ci:quality` and report its real output; in a running build, walk RSVP → confirmation email → withdraw → RSVP again end to end at 390px then desktop, and confirm the admin counts at each step

## Workflow follow-up

- Archive the change after review. Do not publish a hosted event until Resend's domain is verified (delivery item 9) and the privacy page names Turnstile (item 10).
