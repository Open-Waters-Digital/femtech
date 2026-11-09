# Proposal

## Why

The network's success is people joining it, and the site cannot count a
sign-up's source or the steps before it. AGENTS.md has analytics as delivery
item 11: the Open Waters standard, `@open-waters-digital/analytics` (1.2.0,
taxonomy v3) on cookieless PostHog EU, read by the internal analytics app.
luxury-gardens runs it on this same stack; this follows it.

## What Changes

- **The package**, installed from GitHub Packages with `NODE_AUTH_TOKEN`
  locally, in CI and in the Docker build, kept out of the image and the log.
- **Browser analytics, cookieless.** An `Analytics` client component in the
  root layout calls `initAnalytics({ site: "femtech", spa: true, regulated:
false, heatmaps: false })` and `pageChanged()` on every client navigation,
  because the site uses `next/link`. It starts only in production, with
  `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` set, on an indexable
  host, outside an iframe (the admin's preview) and on a page that is not
  `noindex`. PostHog loads after idle, sets no cookie, identifies no one.
- **The proxy origin in the CSP.** The site already sends a nonce-based
  policy; the proxy's origin joins `connect-src` and the `script-src`
  allow-list, read from `NEXT_PUBLIC_POSTHOG_HOST`, as luxury-gardens does.
- **Page types** on `<main data-page-type>`; **CTA ids** on every "join" call to
  action and an event's RSVP button.
- **Forms.** The sign-up form (`signup`) and the RSVP form (`rsvp`) carry
  `data-form-id` and `ph-no-capture`, report `formSubmitted` and
  `formErrorShown` with field names only. The sign-up form also sends
  `ow_attribution` — a hidden field filled by script, since it also posts
  without it. The RSVP form does not: an RSVP is not a lead, so there is no
  channel to classify.
- **`lead_submitted` from `/join`.** After a member is saved, inside the route's
  existing `after()` follow-up, with `form_id: "signup"`, `lead_type:
"membership"` and the v3 channel. An RSVP is not a lead: it is measured by
  the form events only.
- **The objection control**, built and on `/design-system`, ready for the
  privacy page.
- **Ships dark**, as open-waters does: the key stays unset on Railway until the
  privacy page (delivery item 10, the client's wording) is published with the
  control.

## What it costs

- A private dependency: every install now needs a token with `read:packages`,
  and the package must grant this repository Actions access.
- `posthog-js` is the largest script the site will load, idle-loaded and
  same-origin. Apply measures it.
- One more origin in the CSP.

## Does it touch POST /join or the members collection?

**Yes, `/join`.** It accepts one more optional field, `ow_attribution` (a
string of at most 2048 characters, the visit's landing page and referrer as
the package records them), which is **not** stored on the member and **not**
emailed: it is parsed into a channel and sent with `lead_submitted`. Failure
modes: a missing or malformed value classifies as `unknown`; an analytics
failure is caught inside the `after()` follow-up and cannot affect the saved
member, the response or the welcome email. Privacy effect: the event carries
the channel and the landing source fields, never anything the person typed.
The members collection does not change.

## Capabilities

### New Capabilities

- `site-analytics`: what the site measures and how — the gated cookieless
  baseline, page types, CTA, contact-link, scroll and form events, server-side
  lead counting with channel, the privacy guarantees, and the right to object.

### Modified Capabilities

- `signup-form`: accepts `ow_attribution` and sends a lead event after saving.

## Impact

- `package.json`, `.npmrc`, `pnpm-workspace.yaml`, `scripts/docker-install.sh`,
  the Dockerfile, CI, `.railway/railway.ts`, `env.example`.
- `src/components/analytics/`, `src/lib/analytics/`, the root layout, every
  page's `<main>`, the join and RSVP CTAs and forms, `/join`,
  `src/lib/security-headers.ts`, `/design-system`.
- No migration.
