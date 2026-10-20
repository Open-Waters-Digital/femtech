# Proposal

## Why

The client has supplied the final copy for `/sign-up` (supplied 2026-10-20).
It recasts the page as "Become a Member. It’s free.", explains what membership
means, and asks for different information: job title, organisation and
industry, but no free-text message. It also makes the updates checkbox a
condition of joining, and the thank-you message points people to the
network’s LinkedIn. The network has no LinkedIn link anywhere on the site, and
there is nowhere to enter one. luxury-gardens solves the same thing with social
profiles in site settings, so this change does the same here.

## What Changes

- **Sign-up page copy.** An eyebrow ("Sign Up"), the new title and lead, a
  "What membership means" section (an introduction and five benefits, each a
  term and a description), a "Coming soon" section, and a "Join the Network"
  heading over the form. All of it is editable in site settings (Sign-up page
  tab), like the current title and lead. The December 2026 date in the copy
  will go stale, which is one more reason it belongs in the admin.
- **The form.** Labels change to the client’s wording (First name, Last name,
  Email address, Phone number). The new fields are Job title (required),
  Organisation (optional) and Industry (required, one of ten options, as a
  native select). The submit button reads "Become a Member". Under the button
  is the line "We’ll only use your details to keep you updated about FemTech
  Healthcare Network.", followed by "See our Privacy Policy." once the privacy
  page exists.
- **BREAKING (form contract): the Message field is removed from the form**.
  The `message` column stays on members (migrations are additive only), so
  anything already saved remains readable in the admin.
- **BREAKING (form contract): the updates checkbox becomes required**, with the
  client’s wording. A sign-up without it is refused with a field error, from
  the form and from `/join`.
- **Thank-you.** The heading "Welcome to FemTech Healthcare Network." and the
  new message, both editable. Then "In the meantime, follow us on LinkedIn to
  stay connected.", shown only when a LinkedIn profile is set in site settings.
  The same words appear in place (with JavaScript) and on
  `/sign-up/thank-you` (without it).
- **Social profiles in site settings**, after luxury-gardens: a list of
  platform and URL pairs (LinkedIn, Instagram, Facebook, X), each URL checked
  against its platform’s host. They are shown as a row of marks in the footer
  and used for the thank-you LinkedIn link. Nothing renders while the list is
  empty.
- **The team’s notification email** gains Job title, Organisation and Industry,
  and loses Message.

### Touches POST /join and members: yes

- **Members collection:** three new nullable columns (`jobTitle`,
  `organisation`, `industry`). They are not `NOT NULL`, so existing rows and
  members added by hand in the admin stay valid. `message` is kept but no
  longer collected.
- **`/join`:** validates the new fields with the shared schema and saves them.
  The layers, their order, the rejection behaviour and the
  repeat-does-not-overwrite rule are unchanged.
- **Failure modes:**
  - An old page open in a tab posts without the new fields. It is refused with
    field errors (or `not-sent` without JavaScript); nothing is half-saved.
  - An `industry` outside the list is refused by the schema, so a crafted post
    cannot store an arbitrary value.
  - A repeat sign-up does not update the existing row's new fields, which is
    deliberate (see AGENTS.md, "The sign-up path"). The team's email shows what
    they typed this time.
- **Privacy effect:** more personal data is collected (job title, organisation,
  industry). It is professional rather than sensitive, but the privacy notice
  must list it. The message is no longer collected. Every new web sign-up now
  has `emailUpdates` set. Nothing new is logged, and nothing goes to analytics.

## What it costs

- A longer form: two more required fields means more people may give up part
  way, against a richer list.
- **A required marketing checkbox is a compliance question, not a copy
  question.** Under UK GDPR, consent that is a condition of the service is
  generally not "freely given". It holds up only if membership *is* receiving
  these updates. This needs the client's (or their adviser's) confirmation
  before launch. It is recorded as an open question, not decided here.
- A migration (three columns on members, new tables for the benefits and
  social arrays, new site-settings columns), regenerated types, and a re-seed
  of local databases with `SEED_OVERWRITE=1`.
- New server components (`SocialLinks`, `SocialMark`, `CheckboxField`) and a
  select recipe for fields, all on `/design-system`. No new client component:
  `SignupForm` is already one. No new dependency (the four marks are Simple
  Icons paths, CC0, copied in as luxury-gardens did). No new design token.

## Capabilities

### New Capabilities

- `signup-form`: the fields a sign-up collects, how they are validated (form
  and `/join` alike), consent, and what is stored and emailed to the team.
- `signup-page`: the editable copy of `/sign-up` and its thank-you, with and
  without JavaScript.
- `social-links`: the network's social profiles, configured in the CMS and
  shown on the site.

### Modified Capabilities

None. No specs exist yet.

## Impact

- `src/lib/signup/schema.ts` (+ tests), `src/lib/signup/notify.ts` (+ tests),
  `src/app/(frontend)/join/route.ts`
- `src/collections/Members.ts`, `src/globals/SiteSettings.ts`, a new migration,
  `src/payload-types.ts`
- `src/app/(frontend)/sign-up/page.tsx`, `sign-up/thank-you/page.tsx`,
  `src/components/signup/SignupForm.tsx`
- New: `src/components/social/SocialLinks.tsx`, `SocialMark.tsx`;
  `CheckboxField` beside `Field`; a select recipe in `styles/variants.ts`
- `src/components/layout/SiteFooter.tsx`, `/design-system`, `scripts/seed.ts`,
  `AGENTS.md`
