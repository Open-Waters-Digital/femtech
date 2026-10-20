# Spec Delta

## Purpose

Defines the copy and structure of the /sign-up page and its thank-you, which
the team edits in the CMS, and how both read with and without JavaScript.

## ADDED Requirements

### Requirement: Page introduction

/sign-up SHALL show an eyebrow, a title as the page's only level-one heading,
and a lead, each editable in site settings. As supplied, they read "Sign Up",
"Become a Member. It’s free." and "Join FemTech Healthcare Network and be part
of a global community of women shaping the future of healthcare technology."

#### Scenario: Seeded page

- **WHEN** a visitor opens /sign-up on a freshly seeded site
- **THEN** they see the eyebrow, the title as the h1 and the lead with the supplied wording

### Requirement: What membership means

The page SHALL show a section with an editable heading, an introduction and a
list of benefits, each a term and a description that editors can add, remove
and reorder. The section SHALL NOT render when it has no benefits.

#### Scenario: Benefits shown

- **WHEN** site settings hold the five supplied benefits
- **THEN** the page lists Curated events, Speakeasies, Keynotes, Investment pitches and Member spaces, in that order, each with its description

#### Scenario: Benefits emptied

- **WHEN** an editor removes every benefit
- **THEN** the section, including its heading, is not shown

### Requirement: Coming soon

The page SHALL show an editable "Coming soon" heading and body, and SHALL NOT
render the section when the body is empty.

#### Scenario: Editor changes the date

- **WHEN** an editor changes "December 2026" in the body and saves
- **THEN** the next request to /sign-up shows the new wording

### Requirement: Form heading, button and privacy line

The form SHALL sit under an editable heading ("Join the Network"), its submit
button SHALL read "Become a Member", and under it the page SHALL say "We’ll only
use your details to keep you updated about FemTech Healthcare Network." The
sentence "See our Privacy Policy." with a link to the privacy page SHALL follow
it only once that page exists.

#### Scenario: No privacy page yet

- **WHEN** the site has no privacy page
- **THEN** the first sentence is shown and no link to a missing page is rendered

### Requirement: Thank-you message

After a sign-up the visitor SHALL see the editable heading ("Welcome to
FemTech Healthcare Network.") and message, the same with JavaScript (in place,
with focus moved to the heading) and without (on /sign-up/thank-you).

#### Scenario: With JavaScript

- **WHEN** a sign-up succeeds from the enhanced form
- **THEN** the form is replaced by the heading and message, and focus is on the heading

#### Scenario: Without JavaScript

- **WHEN** a sign-up succeeds from a native post
- **THEN** /sign-up/thank-you shows the same heading and message

### Requirement: LinkedIn invitation on the thank-you

The thank-you SHALL end with "In the meantime, follow us on LinkedIn to stay
connected.", with "LinkedIn" linking to the network's LinkedIn profile, only
when one is set in the social profiles.

#### Scenario: LinkedIn set

- **WHEN** site settings hold a LinkedIn profile
- **THEN** the thank-you shows the sentence, linking to that profile

#### Scenario: LinkedIn not set

- **WHEN** no LinkedIn profile is set
- **THEN** the sentence is not shown
