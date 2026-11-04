# Proposal

## Why

Resend is live and the site's emails now reach real inboxes. Two problems
showed up. The emails are bare HTML with no brand at all. And the person who
signs up hears nothing: the thank-you page tells them to "keep an eye on your
inbox", but nothing ever arrives. A welcome email that says what the network is
and what membership gives them is the first thing a new member should get.

## What Changes

- **One branded layout for every email the site sends**: the team's sign-up
  notification, the RSVP confirmation and the new welcome email. Cream ground,
  ink text, the mark at the top, a serif heading, the sand sparkle rule, a
  footer with the site's address. Table-based HTML with inline styles, because
  that is what mail clients render; the plain-text part stays. Nothing about
  what the two existing emails say changes, only how they look.
- **A welcome email to the new member**, sent after the response, from
  `SIGNUP_FROM_EMAIL`, replying to the footer's `contactEmail` when one is set.
  Its copy is the sign-up page's own copy from Site settings → Sign-up page:
  the thank-you heading and message, what membership means (heading,
  introduction, the five benefits), coming soon, and the LinkedIn invitation.
  Then a button to https://www.femtechhealth.com (the deployment's own site
  URL). No new copy fields, so an editor who changes the page changes the email
  too.
- **It goes to new members only.** A repeat sign-up gets nothing, so the form
  cannot be used to send the same person the email over and over.
- **Cloudflare Turnstile goes on the sign-up form, and gates only the welcome
  email.** The welcome is the first email the sign-up form sends to an address
  someone typed in. Without a check in front of it, anyone could use the form
  to send our mail to strangers. AGENTS.md has always made Turnstile the
  condition for this, and the RSVP form already has it. A failed or missing
  check does **not** refuse the sign-up: the member is saved and the team is
  told, exactly as today, but no welcome is sent. That keeps the form working
  without JavaScript (which Turnstile needs) and when Turnstile is blocked.
- **The member records how the welcome went**, in a new read-only sidebar
  field: sent, failed, unconfigured, not verified (no Turnstile pass), or
  skipped (development). The team's notification says whether one was sent.
- **The emails go on `/design-system`**, for reference: the layout and each
  email's design rendered in a frame with placeholder copy. Not a copy review;
  the real copy comes from the admin.
- **`/design-system` becomes local only.** It answers 404 on every deployed
  environment (production and preview) and renders only in development. Today
  it is public and only `noindex`.
- **The LinkedIn profile** (`https://www.linkedin.com/company/femtech-healthcare-network/`)
  goes into the seed's social profiles for new environments. Production is
  configured in the admin (Site settings → Social profiles), since the seed
  never overwrites content; that entry turns on the footer mark, the thank-you
  invitation and the email's invitation.
- **Sent from** `FemTech Healthcare Network <website@notify.femtechhealth.com>`
  (`SIGNUP_FROM_EMAIL`, already set), like the other two emails.

### What it costs

- **Touches `POST /join` and the members collection.** `/join` gains a
  Turnstile verification (one outbound call, 5 s timeout) and a second email
  in `after()`. Members gains one field, so there is a migration (additive: a
  nullable column).
  - Failure modes: Cloudflare slow or down → no welcome, sign-up unaffected,
    logged as `[join] turnstile unavailable`. Resend fails → member saved,
    `welcomeEmail: failed`, error logged without the address. Keys missing in
    production → no welcome for anyone, logged as an error on every sign-up so
    it cannot stay unnoticed.
  - Privacy: the typed address now receives an email, sent nowhere else, and
    only on a new sign-up after a Turnstile pass. Turnstile now sees the IP and
    browser signals of everyone on `/sign-up`, not only on hosted event pages;
    the privacy notice (delivery item 10) must say so. The consent checkbox is
    unchanged: a welcome is a reply to joining, not marketing.
- **A third-party script on `/sign-up`.** Turnstile, loaded once the form is on
  screen, as on event pages. The CSP already allows it. `SignupForm` stays the
  same client component; it gains the widget.
- **Email markup is its own little world.** Inline styles and literal colours,
  because mail clients do not read CSS variables. Those colours live in one
  file the hex rule already exempts, and have to be kept in step with
  `tokens.css` by hand. The webfonts do not travel: headings fall back to
  Georgia, body to Helvetica/Arial.
- **No new dependency.** The layout is a small string builder beside
  `lib/email.ts`, not React Email or MJML. See design.md.
- **People without JavaScript get no welcome email.** That is the price of not
  refusing their sign-up. Today nobody gets one.
- **Existing members are not sent one.** This applies to sign-ups from the
  deploy onwards. A backfill is a separate decision.

## Capabilities

### New Capabilities

- `email-layout`: the brand and structure every email the site sends shares:
  the layout, the plain-text part, escaping, and the footer.
- `welcome-email`: the email a new member receives: when it is sent, what it
  says and where the copy comes from, what gates it, and what is recorded.
- `design-system`: the showcase is reachable only in local development.

### Modified Capabilities

- `signup-form`: the team's notification now says whether the member was
  welcomed. The form carries a Turnstile check that decides the welcome but
  never refuses a sign-up.

## Impact

- `src/lib/email.ts` and a new `src/lib/email-layout.ts`; `src/lib/brand-constants.ts`
  (email colours).
- `src/lib/signup/notify.ts`, `src/lib/events/confirm.ts`: rendered through
  the layout.
- New `src/lib/signup/welcome.ts` and tests.
- `src/lib/events/turnstile.ts` moves to `src/lib/turnstile.ts` (it is no
  longer only for events); the client loader moves out of `RsvpForm` so
  `SignupForm` can share it.
- `src/app/(frontend)/join/route.ts`: the Turnstile check and the welcome send.
- `src/components/signup/SignupForm.tsx`: the widget; `sign-up/page.tsx` passes
  the site key.
- `src/collections/Members.ts`: the `welcomeEmail` field; a migration;
  regenerated `payload-types.ts`.
- `src/app/(frontend)/design-system/page.tsx`: the Emails section, and a 404
  outside development.
- `scripts/seed.ts`: the LinkedIn profile.
- `AGENTS.md`: the sign-up path, the backlog item, privacy, the Turnstile
  hardening item now covers the sign-up form too.
