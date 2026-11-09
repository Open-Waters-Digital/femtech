# Tasks

## 1. The package

- [x] 1.1 Add `@open-waters-digital/analytics@1.2.1`, `posthog-js` and `posthog-node` at luxury-gardens' versions; the scope line in `.npmrc`; `core-js: false` and the `@open-waters-digital/*` release-age exemption in `pnpm-workspace.yaml`. Verify `pnpm install --frozen-lockfile` with `NODE_AUTH_TOKEN` exported, and no token in the committed `.npmrc`.
- [x] 1.2 `scripts/docker-install.sh`; `ARG NODE_AUTH_TOKEN` in the install stages only and `NEXT_PUBLIC_POSTHOG_KEY/HOST` where the build reads them; CI `packages: read`, setup-node `registry-url`/`scope`, the token for install and the image; `preserve()` for all three on Railway; the variables, unset, in `env.example`. Verify the image builds and `docker history` shows no token.

## 2. Gate, CSP, page types and markup

- [x] 2.1 `src/components/analytics/Analytics.tsx` in the root layout (production, both variables, `isIndexable()`, not framed, no robots `noindex`; `spa: true`, `regulated: false`, `pageChanged()` on client navigation). Unit-test every branch. Verify dev, an unset production build and `/design-system` make no PostHog request.
- [x] 2.2 Add the proxy origin from `NEXT_PUBLIC_POSTHOG_HOST` to `connect-src` and `script-src`; unit-test set and unset. Verify a production run with test values reports no CSP violation in the console.
- [x] 2.3 `data-page-type` on every page's `<main>` per design Decision 4; `data-cta`/`data-cta-location` on every join link and the RSVP button. Verify in the rendered HTML of each route.

## 3. Forms and the lead

- [x] 3.1 Sign-up and RSVP forms: `data-form-id`, `ph-no-capture`, a hidden `ow_attribution` filled from `attributionField()`, `formSubmitted` and `formErrorShown` in the enhanced path. Accept `ow_attribution` in the sign-up schema (optional, ≤2048), never stored, emailed or logged. Verify the existing form tests pass, and a test that the saved member and both emails carry no attribution.
- [x] 3.2 `src/lib/analytics/lead.ts`: pure `leadProperties` and `sendLead` behind `isIndexable()`; call it in `/join`'s `after()` follow-up after the member is saved, in its own catch. Tests: a saved sign-up captures once with channel; a no-script sign-up is `unknown`; bot drops, rejections and an RSVP capture nothing; a capture that throws or hangs leaves the response and the welcome email unchanged.

## 4. Objection control

- [x] 4.1 `AnalyticsObjectionControl` (Button, `aria-live` status, disabled without script), on `/design-system` in its measuring, objected and no-script states. Verify the 44px target, visible focus, Enter and Space, and that the state survives a reload.

## 5. Verify and document

- [x] 5.1 Against a local production build on an indexable host name with test values: page views (including after client navigation), a join CTA click, the sign-up funnel and no cookie. Measure the `posthog-js` chunk's gzip size and LCP on `/` at 390px and 1440px, unset versus set; record in AGENTS.md.
- [x] 5.2 Sweep AGENTS.md: item 11 to ✅ (dormant), the stack table, the Privacy section, the setup gate, the repo tree.
- [x] 5.3 Run `pnpm run ci:quality` and report the real output.

## 6. Activation (after merge; by a human — see the setup list)

- [ ] 6.1 PostHog organisation (owned by the network) and project, the proxy, app registration, per the onboarding checklist.
- [ ] 6.2 The privacy page (delivery item 10) published, naming PostHog, with the objection control. **6.3 waits for this.**
- [ ] 6.3 Set the key and host on Railway, redeploy, run _Prove it works_ against production.
