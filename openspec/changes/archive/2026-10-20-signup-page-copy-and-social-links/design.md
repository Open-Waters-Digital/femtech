# Design

## Context

- `lib/signup/schema.ts` is the one Zod schema for the form and `/join`.
  `signupInput` turns FormData into its input. `emailUpdates` is read as
  presence and is currently `z.boolean()`.
- `/join` saves `{ ...signup, status: 'active' }` and answers an invalid
  native post with `/sign-up/not-sent?reason=check`, and an invalid JSON post
  with `400 { fields }`. Both paths are unchanged here.
- `SignupForm` is the one client component on the page. It focuses the first
  invalid field by `name` in the order of the error keys.
- Site settings already hold `signupTitle`, `signupLead` and `signupThanks`.
  The thank-you heading ("You’re signed up") is hard-coded in two places.
- There is no privacy page yet (delivery item 10).
- luxury-gardens has `social` on site settings, `SocialLinks` and `SocialMark`
  (Simple Icons paths, currentColor, 44px targets). This design copies its
  shape.

## Goals / Non-Goals

**Goals:** the supplied copy, verbatim; the new fields end to end; social
profiles editable once and shown in the footer and the thank-you.

**Non-Goals:** the privacy page itself; updating an existing member on a repeat
sign-up; emailing the member; a members export; social profiles anywhere other
than the footer and the thank-you; the founder's personal LinkedIn
(`about.founderLinkedIn`), which stays separate because it is a person's
profile, not the network's.

## Decisions

### The schema owns the industry list

`INDUSTRIES` is a constant array of `{ value, label }` in
`lib/signup/schema.ts`. The schema uses `z.enum(values)`, the form renders the
options from it, the Members `industry` select builds its options from it, and
`notify.ts` maps a value to its label. The values are slugs (`clinical`,
`healthtech`, `digital-health`, `femtech`, `life-sciences`, `investment`,
`public-sector`, `consulting`, `academia`, `other`), so a later rewording of a
label is not a data migration. *Alternative:* store the label. That is
rejected, because a copy edit would leave old rows with a value that matches no
option.

### Consent is `z.literal(true)`

`emailUpdates: z.literal(true, { message: 'Please tick this box to become a
member.' })`. The inferred type stays `true`, and Members still stores a
checkbox. `/join` needs no new branch: a missing box is an ordinary field error,
so the native post goes to `not-sent?reason=check`, whose copy already says to
check the form. The Members field keeps `defaultValue: false`, because a member
added by hand has not ticked anything. Its admin description changes to say
web sign-ups always carry it.

### New Members columns are nullable

`jobTitle` (text, maxLength 120), `organisation` (text, maxLength 200) and
`industry` (select from `INDUSTRIES`) have no `required: true`. Required lives
in the Zod schema, which is the only public way in. A `NOT NULL` column would
fail the migration on existing rows and break hand-added members, and the
migration has to be additive while the old container still serves. `message`
stays on the collection, with its description changed to "From the old form.
No longer asked for." It is removed from `SIGNUP_LIMITS`, the schema and the
email.

### One `CheckboxField` primitive

The checkbox needs the same wiring as `Field`: id, `aria-describedby`,
`aria-invalid` and an error in words. Today it is a bare label with none of
these. `CheckboxField` sits in `Field.tsx` and shares the error markup.
*Alternative:* a render-prop `Field` around a checkbox. That is rejected,
because the label has to sit beside the control, not above it. It is on
`/design-system` unticked, ticked, in error and focused.

### Required marks: keep "(optional)", not asterisks

The supplied copy marks required fields with `*`. The site's convention is to
mark what is optional, which is the label that changes what someone does, and
an asterisk needs a legend to be accessible. This design keeps "(optional)" on
Phone number and Organisation and drops the asterisks. It is a one-line flip in
`Field` if the client insists.

### Select recipe

A native `<select>` with `fieldClasses` plus an `appearance-none` chevron,
added to `styles/variants.ts` as `fieldClasses(state, 'select')`. The chevron is
an inline SVG background drawn in `currentColor` via a CSS mask, so it needs no
hex. The first option is an empty, disabled "Choose your industry"
placeholder, so "not chosen" is distinguishable from "Other". *Alternative:*
radio buttons. That is rejected: ten options makes a long column on a phone.

### Copy fields on site settings

The Sign-up page tab gains `signupEyebrow`, `signupBenefitsHeading`,
`signupBenefitsIntro`, `signupBenefits` (array of `title`, `description`),
`signupComingSoonHeading`, `signupComingSoonBody`, `signupFormHeading` and
`signupThanksHeading`. None are `required`, so the existing global row stays
valid after the migration. Each section renders only when it has content.
Field labels, the button, the privacy line and the LinkedIn sentence stay in
code beside the form, as the current labels and not-sent messages do: they are
interface text tied to behaviour, not page copy.

### Page layout

On a phone: the introduction, the benefits, coming soon, then the form. From
`lg`, two columns as now: the copy at `col-span-5` and the form with its
heading at `col-span-7`, so the form is still reachable without scrolling past
everything on desktop. Benefits are a `<ul>` with the term in `<strong>`
followed by its description, matching the supplied "Term: description" form.

### The privacy link waits for the page

`PRIVACY_PATH` in `components/layout/navigation.ts` is `null` until delivery
item 10 sets it. The form renders "See our Privacy Policy." only when it is
set. *Alternative:* link `/privacy` now. That is rejected, because it would
404, and this site already has a rule against linking to `#`.

### Social profiles

`social` is an array on site settings: `platform` (select: `linkedin`,
`instagram`, `facebook`, `x`) and `href` (text, required). It is validated per
platform against `^https://([a-z0-9-]+\.)?<host>/`, with X accepting `x.com`
and `twitter.com`. `components/social/SocialMark.tsx` holds the four Simple
Icons paths and `PLATFORM_LABELS`. `SocialLinks.tsx` renders the row, returns
`null` when empty, uses a `size-11` link with a `size-5` mark, and dims on
hover with `opacity-70`, which the header already uses. So no new token is
needed. In the footer it sits on the copyright line, at its far end from `md`
and under it on a phone. `linkedInUrl(settings)` returns the first LinkedIn
profile for the thank-you. Links go through `SmartLink`, which opens an external
URL in a new tab with `rel="noopener noreferrer"`, as the founder's LinkedIn
button already does.

### Thank-you content in one place

The thank-you markup is extracted into `SignupThanks` (server-safe, no
hooks), used by `SignupForm` and by `/sign-up/thank-you`. It takes `heading`,
`message` and `linkedIn`. The heading's ref is forwarded so the form can still
move focus. This replaces the two hard-coded copies of "You’re signed up".

## Risks / Trade-offs

- [Required consent may not be valid consent under UK GDPR] → This is flagged
  in the proposal and added to AGENTS.md's open questions for the client. If
  they want it optional, it is a one-line schema change and a label change, not
  a redesign.
- [An open, stale tab posts the old shape] → It is refused as invalid. With
  JavaScript the visitor sees field errors on fields they cannot see until they
  reload. The general failure message names reloading. The risk is accepted:
  the site is not live.
- [The seed never overwrites a global with content] → Local databases need
  `SEED_OVERWRITE=1 pnpm run seed`. Production has not been seeded yet, so it
  gets the new copy first time.
- [Benefits array and social array add two join tables] → They are read through
  the existing cached `getSiteSettings`, so there is no per-request cost
  beyond the cache.

## Migration Plan

One additive migration (`pnpm run migrate:create signup_copy_and_social`):
nullable columns on `members` and `site_settings`, an enum for `industry`, and
tables for `site_settings_signup_benefits` and `site_settings_social`. It is
applied by Railway pre-deploy. Rollback is the previous image. The new
columns are ignored by old code.

## Open Questions

- The checkbox wording and the privacy line are the client's. Whether the
  required checkbox is lawful is theirs or their adviser's to confirm (above).
- The network's LinkedIn URL has not been supplied. The thank-you sentence and
  the footer mark appear when it is entered.
