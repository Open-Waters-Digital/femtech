# Design

## Context

luxury-gardens' integration is the reference (`src/components/analytics/`,
`src/lib/enquiries/lead-event.ts`, `src/lib/security-headers.ts`, its
Dockerfile and CI). Where femtech differs:

- Public pages **render per request** (AGENTS.md); the build never reads the
  database. Nothing here changes that.
- Navigation uses `next/link`, so pages change without a document load.
- The CSP is per request with a nonce and `'strict-dynamic'`
  (`src/proxy.ts`, `src/lib/security-headers.ts`).
- `/join` and `/events/[slug]/rsvp` are route handlers that work without
  JavaScript (303 redirects) and with it (JSON). `/join` already runs its
  follow-up in `after()`.
- There is no privacy page yet (delivery item 10).

## Decisions

### 1. Install as luxury-gardens does

The package at 1.2.0 with `posthog-js` and `posthog-node` at luxury-gardens'
versions; `.npmrc` gains the scope line only; `core-js: false` and the
`@open-waters-digital/*` release-age exemption; `scripts/docker-install.sh`;
`ARG NODE_AUTH_TOKEN` in the install stages only; CI `packages: read` with
setup-node's `registry-url`/`scope`; `preserve()` on Railway.

### 2. The gate

`Analytics.tsx` in the root layout: production, both variables, `isIndexable()`
from `src/lib/site-env.ts`, not framed, no robots `noindex`. `spa: true`, and a
second effect calls `pageChanged()` when `usePathname()` changes after the
first render. `regulated: false`.

**Regulated or not** is the client's call (onboarding checklist §1). The
network is a community, not a healthcare provider, and no page shows personal
data, so the proposal is `false`, as luxury-gardens; the forms are
`ph-no-capture` either way. If the network decides otherwise it is one flag.

### 3. CSP

`contentSecurityPolicy` takes an optional `analyticsHost`; its origin is added
to `connect-src` and to `script-src` beside the Turnstile origin.
`'strict-dynamic'` already admits the package's dynamically imported chunk,
which is same-origin; the allow-list entry covers what `posthog-js` loads from
the proxy and browsers without `'strict-dynamic'`. Unset, nothing is added.

### 4. Page types

| Route                                              | Type      |
| -------------------------------------------------- | --------- |
| `/`                                                | `home`    |
| `/about-us`                                        | `about`   |
| `/sign-up`                                         | `contact` |
| `/events`                                          | `listing` |
| `/events/[slug]`, thank-you, not-sent, withdraw, 404 | `other` |
| `/design-system` (never sent)                      | `other`   |

`/sign-up` is `contact`: it is the site's one conversion page, which is what
that type means across clients.

### 5. CTAs and forms

- Every link to `/sign-up` that invites joining carries `data-cta="join"` with a
  `data-cta-location` (header, hero, about, footer as found); an event's RSVP
  button carries `data-cta="event-rsvp"`.
- `data-form-id="signup"` and `"rsvp"`, with `ph-no-capture`.
- `ow_attribution`, on the sign-up form only: a hidden input, set from
  `attributionField()` as the enhanced form sends. A no-script post sends it
  empty, which classifies as `unknown`. The RSVP form has none: it sends no
  lead.
- `formSubmitted` / `formErrorShown` in the enhanced submit path.

### 6. The lead

`leadProperties({ ow_attribution })` → `{ form_id: "signup", lead_type:
"membership", channel, ...attribution }`, pure and tested. `sendLead` behind
`isIndexable()`, with `createServerCapture({ site: "femtech", key })` on first
use, called inside the route's existing `after()` follow-up after the member is
saved, in its own try/catch. Bot drops and rejected sign-ups send nothing. An
RSVP sends no lead. _As built:_ a repeat sign-up (an address already a member)
sends none either — it saves nothing new, and counting it would let one person
be several leads. It is still a `form_submitted`.

### 7. Objection control

`AnalyticsObjectionControl`, as luxury-gardens': `Button` and an `aria-live`
status, `useSyncExternalStore` over `hasObjected`, disabled without script. On
`/design-system` now; placed on the privacy page by item 10.

### 8. Activation gate

The key is set on Railway only after: the PostHog organisation and project per
the onboarding checklist (owned by the network); the proxy (e.g.
`e.femtechhealth.com`) live; the privacy page published naming PostHog, with
the control; and then _Prove it works_ against production.

## Risks / Trade-offs

- **[Risk] The token** blocks installs until it is set everywhere → first on
  the setup list.
- **[Risk] A strict CSP blocks something PostHog loads** → the proxy origin is
  in both directives; the _Prove it works_ run checks the console for CSP
  reports.
- **[Trade-off] No-script sign-ups are `unknown`** → accepted; they are rare and
  still counted.
