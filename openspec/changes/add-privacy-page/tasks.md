## 1. Content model

- [ ] 1.1 `src/globals/PrivacyPolicy.ts`: title, effectiveDate, metaDescription
      and sections (heading + paragraph / subheading / list /
      analyticsObjection blocks), drafts on, read published-only for
      anonymous users, `afterChange` revalidating the page and the sitemap;
      registered in `payload.config.ts`
- [ ] 1.2 Migration (`pnpm migrate:create`) and regenerated `payload-types.ts`

## 2. The page

- [ ] 2.1 `src/lib/privacy-policy.ts`: read the published global (draft for an
      editor in draft mode), null when never published; tests
- [ ] 2.2 `src/app/(frontend)/privacy-policy/page.tsx`: `notFound()` when null;
      title, effective date, numbered sections, blocks in order;
      `AnalyticsObjectionControl` at its block; `pageType="legal"`; metadata
- [ ] 2.3 The policy's renderer on `/design-system`, every block kind shown
- [ ] 2.4 Sitemap lists `/privacy-policy` only while published

## 3. Links

- [ ] 3.1 A published-policy check read once in the layout; the sign-up form's
      line links only when it is true
- [ ] 3.2 The RSVP form gains "See our Privacy Policy." under the same check
- [ ] 3.3 Footer "Privacy policy" link under the same check

## 4. Seed

- [ ] 4.1 `scripts/seed.ts` writes the drafted policy (design.md) as a draft
      when the global is empty, never publishing and never overwriting; test

## 5. Verify and document

- [ ] 5.1 `pnpm run ci:quality`
- [ ] 5.2 Running app: 404 before publishing; after publishing in the admin,
      the page at 390px and 1440px, the control working by keyboard and
      degrading without JS, the three links appearing
- [ ] 5.3 AGENTS.md: delivery item 10, Privacy and compliance, the open
      question on wording (drafted, awaiting approval), repo tree

## 6. Client (not code)

- [ ] 6.1 The network supplies the legal entity, registered office, rights
      address, Railway region confirmation and retention periods, and approves
      the wording
- [ ] 6.2 An editor fills the brackets, sets the effective date and publishes
