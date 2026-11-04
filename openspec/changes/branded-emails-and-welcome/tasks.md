# Tasks

## 1. The branded layout

- [x] 1.1 Add `EMAIL_COLOURS` to `lib/brand-constants.ts`, with a test that each value equals its `--color-*` in `tokens.css`; verify the test passes and fails when a value is changed
- [x] 1.2 Add `lib/email-layout.ts` (`renderEmail` and the block union: paragraph, list, table, button, divider, smallprint), escaping inside each block; verify unit tests for the HTML and text parts, `<script>` in every block type, a URL with quotes in a button, and the preheader
- [x] 1.3 Render the team notification through the layout; verify the existing `notify.test.ts` escaping and header-injection tests still pass unchanged and a new test asserts the mark and footer
- [x] 1.4 Render the RSVP confirmation through the layout; verify `confirm.test.ts` passes and the withdraw link is present in both parts
- [x] 1.5 Add `lib/email-fixtures.ts` (placeholder copy) and the "Emails" section on `/design-system` (team notification, RSVP confirmation) in sandboxed frames at 390px and 640px; verify at 390px and desktop in a running build with no CSP violations in the console

## 1a. `/design-system` local only

- [x] 1a.1 Make the page `notFound()` unless `siteEnv()` is `development`; verify a test (or a request against `pnpm start` with `SITE_ENV=preview` and `SITE_ENV=production`) gets the site's 404, and without `SITE_ENV` the page renders

## 2. Shared Turnstile

- [x] 2.1 Move `lib/events/turnstile.ts` and its test to `lib/turnstile.ts`, updating imports; verify the gate passes with no behaviour change
- [x] 2.2 Extract the loader and on-screen rendering from `RsvpForm` into `components/turnstile/useTurnstile.ts`; verify the RSVP flow end to end in the running app (test keys) and the `RsvpForm` showcase states unchanged

## 3. Recording the welcome on the member

- [x] 3.1 Add the `welcomeEmail` field to `Members` (read-only, sidebar), run `pnpm run migrate:create member-welcome-email` and `pnpm run generate:types`; verify the migration is additive only and applies to the local database

## 4. The welcome email

- [x] 4.1 Add `lib/signup/welcome.ts` (`buildWelcome`, `sendWelcome`) and a content read for it in `lib/content.ts`; verify tests for: the seeded copy, the greeting, an emptied section left out, LinkedIn present and absent, markup in a first name and in editor copy, subject on one line, reply-to set only with a contact email, `unconfigured` in production and `skipped` in development, timeout reported as `failed`
- [x] 4.2 Add the welcome outcome to the team notification (sent, failed, not verified, not configured, repeat); verify tests for each line in both parts
- [x] 4.3 Add the welcome to the showcase's Emails section with placeholder copy; verify in the running build

## 5. Wiring `/join` and the form

- [x] 5.1 In `/join`, read `cf-turnstile-response`, and in `after()` verify, send the welcome for a new member with a pass, then notify the team with the outcome and record both fields in one update; verify tests (with the send and verify seams) for: pass → welcomed, fail → unverified, no token → unverified, unavailable → unverified and logged, repeat → no welcome and no update, welcome failure still notifies the team, and no log line containing a name or address
- [x] 5.2 Add the widget to `SignupForm` through `useTurnstile`, the sign-up page passing the site key; wait up to 5 s for an unsolved check and block submit only while Cloudflare wants a tick, with the message above the button; verify at 390px and desktop with test keys: JS sign-up is welcomed, sign-up with JavaScript disabled is saved and marked "not verified", and sign-up with the Turnstile origin blocked still succeeds
- [x] 5.3 Add the form's "complete the check" state to the showcase; verify it renders on `/design-system`

## 6. Content and documentation

- [x] 6.1 Add the LinkedIn profile `https://www.linkedin.com/company/femtech-healthcare-network/` to the seed's social profiles; verify `pnpm run seed` on an empty database shows the footer mark and the thank-you invitation
- [x] 6.2 Sweep AGENTS.md: the sign-up path (steps 6 and 7), the welcome email out of the backlog, privacy (Turnstile on `/sign-up`, the welcome to the typed address), the Turnstile hardening item covering sign-up, the email layout under engineering standards, `/design-system` local only (repo tree and Feature scope), the repo tree, and the subject and footer wording under copy written here; verify by reading it against the code

## 7. Integration

- [x] 7.1 Run `pnpm run ci:quality` and report the real output, failures included
- [ ] 7.2 Send the welcome, the team notification and an RSVP confirmation through Resend to a real Gmail and Outlook inbox from a running build; check the layout at phone and desktop widths, with images blocked, and the text part
- [ ] 7.3 After deploying, verify `/design-system` answers 404 on https://www.femtechhealth.com (or the Railway address before cut-over)

## Workflow follow-up

- After deploying: confirm the Turnstile widget's hostnames include `www.femtechhealth.com` (the keys are set in Railway), and sign up once on https://www.femtechhealth.com with a fresh address.
- Archive the change once the delivery checks are done.
