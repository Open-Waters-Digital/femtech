# Tasks

## 1. Social profiles

- [x] 1.1 Add `social` (platform select, href with per-platform https host validation) to `SiteSettings`, create the migration, run `pnpm run generate:types`; verify with a unit test of the URL validator (right host, wrong host, http, subdomain, twitter.com for X)
- [x] 1.2 Add `components/social/SocialMark.tsx` (four Simple Icons paths, `PLATFORM_LABELS`) and `SocialLinks.tsx` (null when empty, 44px targets, currentColor, `opacity-70` hover), with tests for the empty list, order and accessible names; add both to `/design-system` on cream and on `ground-dark`, and verify the focus ring on each
- [x] 1.3 Render `SocialLinks` on the footer's copyright line and add `linkedInUrl(settings)` in `lib/content.ts`; verify at 390px and desktop with a LinkedIn profile entered in the admin, and that the footer is unchanged with none

## 2. Form primitives

- [x] 2.1 Add `CheckboxField` to `components/primitives/Field.tsx`, with error and hint wiring; add it to `/design-system` unticked, ticked, in error and focused, and verify keyboard toggling and the focus ring on cream and dark grounds
- [x] 2.2 Add the select recipe to `styles/variants.ts` (`fieldClasses(state, 'select')`, mask-drawn chevron, no hex); add a select to `/design-system` in default, invalid and focused states, and verify the variants test still passes on literal class strings

## 3. The form's contract (schema, members, form fields, notification)

One task, because the schema is shared: changing it without the form and the
collection in the same step would leave a form the server refuses.

- [x] 3.1 In one change: `lib/signup/schema.ts` gains `INDUSTRIES`, `jobTitle` (required, 120), `organisation` (optional, 200) and `industry` (`z.enum`), `emailUpdates` becomes `z.literal(true)`, and `message` is removed (the surname message becomes "last name"); `Members` gains the three nullable fields, with `message` kept and its limit inlined and the descriptions updated; `SignupForm` gets the client's labels, the three new fields (Industry as a select with an empty placeholder), `CheckboxField` for consent and no Message field; `notify.ts` adds Job title, Organisation and Industry (by label) and drops Message. Create the migration and regenerate types. Verify with `schema.test.ts` (missing, too long, unknown industry, unticked consent) and `notify.test.ts` (new rows, `<script>` in a job title escaped, a dash for an empty organisation), that the migration applies to a local database holding an existing member who still saves in the admin, and a real sign-up through the form with and without JavaScript
- [x] 3.2 Add `/join` route tests: an unticked consent answers 400 with fields (JSON) and `not-sent?reason=check` (native), and a repeat sign-up leaves the stored job title, organisation and industry untouched

## 4. The sign-up page

- [x] 4.1 Add the Sign-up page copy fields (`signupEyebrow`, `signupBenefitsHeading`, `signupBenefitsIntro`, `signupBenefits`, `signupComingSoonHeading`, `signupComingSoonBody`, `signupFormHeading`, `signupThanksHeading`) to `SiteSettings`, all optional, with migration and types; update `scripts/seed.ts` with the supplied copy verbatim (curly apostrophes) and verify with `SEED_OVERWRITE=1 pnpm run seed` locally
- [x] 4.2 Rebuild `sign-up/page.tsx`: eyebrow, h1, lead, benefits list, coming soon, then the form under its heading; each section omitted when empty; verify at 390px and desktop, and that emptying the benefits in the admin removes the section on the next request
- [x] 4.3 Finish `SignupForm`: the "Become a Member" button and the privacy line, with the link behind `PRIVACY_PATH` (`null` for now); verify without JavaScript (native post to thank-you and to not-sent), and with JavaScript that an unticked box focuses the checkbox
- [x] 4.4 Extract `SignupThanks` (heading, message, LinkedIn sentence only when `linkedInUrl` is set) and use it in `SignupForm` and `sign-up/thank-you/page.tsx`; verify focus moves to the heading in place, and that the sentence appears and disappears with the LinkedIn profile

## 5. Integration and documentation

- [x] 5.1 Sweep `AGENTS.md`: the sign-up feature list and fields, the privacy "Collected" list (job title, organisation, industry; no message), social profiles under The site, the repo tree (`components/social/`), and the open questions (the required-consent lawfulness question, the network's LinkedIn URL, the asterisk convention; remove the answered thank-you and checkbox-wording questions)
- [x] 5.2 Run `pnpm run ci:quality` and report its real output; walk the whole path at 390px then desktop in a running build: fill the form, submit, see the thank-you, and check the member row and the team email (or its `skipped` notification) in the admin

## Workflow follow-up

- Archive the change once the client has confirmed the consent question or accepted it as an open item.
