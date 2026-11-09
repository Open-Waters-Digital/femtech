## ADDED Requirements

### Requirement: The policy is served at /privacy-policy once published

The site SHALL serve the privacy policy at `/privacy-policy` from the
`privacyPolicy` global, showing its title, its effective date when set, and its
sections numbered by position. The route SHALL return 404 while the global has
never been published, and SHALL list in the sitemap only while it is published.

#### Scenario: Published

- **WHEN** an editor has published the policy and a visitor opens
  `/privacy-policy`
- **THEN** the page shows the title, "Effective <date>" when a date is set, and
  each section with its number, heading and blocks in order

#### Scenario: Never published

- **WHEN** the global has only ever been saved as a draft
- **THEN** `/privacy-policy` returns the site's 404 and the sitemap omits it

#### Scenario: Editor preview

- **WHEN** a signed-in editor opens the page in draft mode
- **THEN** the latest draft is shown

### Requirement: Sections are made of paragraphs, lists and the objection control

Each section SHALL hold a heading and an ordered run of blocks: a paragraph, a
subheading, a list of items, or the analytics objection control. Editors SHALL
change words and order, never styling.

#### Scenario: Objection control placed

- **WHEN** a section contains the objection control block
- **THEN** the page renders `AnalyticsObjectionControl` at that position, with
  the block's labels or the control's own when they are empty

#### Scenario: Without JavaScript

- **WHEN** the page loads without JavaScript
- **THEN** the control renders disabled with its line explaining it needs
  JavaScript, and the rest of the policy reads normally

### Requirement: The forms and the footer link to the policy only when it exists

The sign-up form's privacy line, the RSVP form's privacy line and a footer link
SHALL link to `/privacy-policy` only while a published policy exists. Otherwise
the sign-up form keeps its line without the link, the RSVP form shows no line,
and the footer shows no link.

#### Scenario: Published

- **WHEN** a policy is published
- **THEN** the sign-up form reads "See our Privacy Policy." linking to it, the
  RSVP form carries the same line, and the footer links "Privacy policy"

#### Scenario: Not published

- **WHEN** no policy is published
- **THEN** no page on the site links to `/privacy-policy`

### Requirement: The seed is the drafted policy, marked as a draft

The seed SHALL create the global as an unpublished draft containing the policy
drafted in this change, with visible placeholders in square brackets where the
client must supply a fact. The seed SHALL NOT publish it and SHALL NOT
overwrite a policy that already exists.

#### Scenario: Fresh database

- **WHEN** `pnpm seed` runs against a database with no policy
- **THEN** the policy exists as a draft with the drafted sections, and
  `/privacy-policy` still returns 404

#### Scenario: Existing policy

- **WHEN** a policy has already been saved
- **THEN** the seed leaves it unchanged
