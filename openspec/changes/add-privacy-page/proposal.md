## Why

The sign-up form and the RSVP form collect personal data, and nothing on the
site says what happens to it (delivery item 10). Analytics is built and dormant
(`add-analytics`) and cannot be switched on until a privacy page names PostHog
and carries the objection control. The Webflow site has no privacy page either,
so there is nothing to transcribe.

Open Waters was asked (2026-11-09) to draft the policy rather than wait for the
client's wording, after the luxury-gardens policy. That reverses the standing
"do not draft legal copy" rule for this page only, and only as a draft: the
network approves it, with their adviser if they have one, before it is
published. Nothing here is legal advice.

## What Changes

- A `/privacy-policy` page, from a new `privacyPolicy` global: a title, an
  effective date and numbered sections, each a run of paragraphs, lists and
  the analytics objection control. Editable in the admin, like every other
  page's copy.
- The drafted policy (in `design.md`) as the seed: who the network is, what
  the sign-up and RSVP forms collect, why, who processes it, how long it is
  kept, the cookieless visitor statistics with the objection control, and the
  visitor's rights. Placeholders where only the client can answer: the legal
  entity, the contact address for rights requests, and the retention periods.
- `PRIVACY_PATH` set, so the sign-up form's "See our Privacy Policy." link and
  a footer link appear; the RSVP form gains the same line.
- `AnalyticsObjectionControl` moves from a showcase-only component to the page.
- Nothing is published until the global is: an unpublished policy is a 404,
  and `PRIVACY_PATH` links only once there is a published policy.

**Does not touch `POST /join` or the `members` collection.** No field is added,
removed or validated differently; the form gains a link.

## Capabilities

### New Capabilities

- `privacy-page`: the privacy policy at `/privacy-policy`, its content model,
  its links from the sign-up form, the RSVP form and the footer, and the
  objection control.

### Modified Capabilities

None. The form's privacy line is specified in `privacy-page`, as the page's
entry points; the sign-up spec says nothing about it today.

## Impact

- **Costs:** a global and its migration; one server-rendered route; the
  objection control's client component (already built, about 1 KB) on one
  page. No new dependency, no new client component.
- **Code:** `src/globals/PrivacyPolicy.ts`, `src/app/(frontend)/privacy-policy/`,
  `src/lib/privacy-policy.ts` (the drafted seed), `navigation.ts`,
  `SiteFooter.tsx`, the RSVP form, `scripts/seed.ts`, the sitemap, a
  migration and `payload-types.ts`.
- **Unblocks:** analytics activation (`add-analytics` 6.x) and real sign-ups.
- **Blocked on the client for publishing, not for building:** the legal entity
  and registered office, the rights-request address, retention periods, and
  their approval of the wording. The required updates checkbox (Open
  questions) is unchanged here, and the draft describes it as it is.
