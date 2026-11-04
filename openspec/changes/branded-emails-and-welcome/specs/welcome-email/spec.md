# Spec Delta

## Purpose

Welcomes each new member by email: what FemTech Healthcare Network is, what
membership gives them and what comes next, in the sign-up page's own words,
sent only where the form cannot be used to mail strangers.

## ADDED Requirements

### Requirement: New members are welcomed

When a sign-up creates a new member and its Turnstile check passed, the member
SHALL be emailed a welcome at the address they gave, after the response, from
the configured sending address, replying to the public contact email when one
is set. Nobody else SHALL receive it.

#### Scenario: New sign-up with a passing check

- **WHEN** a visitor signs up with an address not yet on the list and the check passes
- **THEN** that address receives the welcome email, and no other address does

#### Scenario: Reply

- **WHEN** a member replies to the welcome and a contact email is set in Site settings
- **THEN** the reply goes to the contact email

### Requirement: Repeat sign-ups are not welcomed again

A sign-up from an address already on the members list SHALL NOT send a welcome,
and the visitor's answer SHALL be the same as for a new member.

#### Scenario: Same address twice

- **WHEN** someone signs up with an address that is already a member
- **THEN** no welcome is sent, and the page answers as it does for a new member

### Requirement: Turnstile gates the welcome, not the sign-up

A sign-up whose Turnstile check is missing, fails or cannot be verified SHALL
still be saved and the team notified, and SHALL NOT be sent a welcome.

#### Scenario: No JavaScript

- **WHEN** a visitor signs up through the form without JavaScript
- **THEN** they become a member and see the thank-you page, the team is emailed, and no welcome is sent

#### Scenario: Check failed

- **WHEN** the Turnstile token is rejected by Cloudflare
- **THEN** the member is saved and no welcome is sent

#### Scenario: Cloudflare unreachable

- **WHEN** verification times out after 5 seconds or Cloudflare answers with an error
- **THEN** the member is saved, no welcome is sent, and `[join] turnstile unavailable` is logged with no personal data

#### Scenario: Keys missing outside development

- **WHEN** the Turnstile keys are not configured outside development
- **THEN** no welcome is sent and an error is logged for each sign-up

### Requirement: The welcome's content

The welcome SHALL greet the member by first name and give, from Site settings →
Sign-up page: the thank-you heading and message; what membership means
(heading, introduction and benefits); and coming soon. It SHALL link to the
site's home page. A section an editor has emptied SHALL be left out.

#### Scenario: Copy as supplied

- **WHEN** a member is welcomed with the seeded copy
- **THEN** the email opens "Hello <first name>," and reads "Welcome to FemTech Healthcare Network.", "You’re officially a member…", the five benefits, and the coming-soon paragraph

#### Scenario: Editor changes the benefits

- **WHEN** an editor edits a benefit on the sign-up page and saves
- **THEN** the next welcome carries the edited benefit

#### Scenario: Coming soon emptied

- **WHEN** the coming-soon body is empty
- **THEN** the welcome has no coming-soon section and no empty heading

### Requirement: LinkedIn invitation in the welcome

When the network's LinkedIn profile is set under Social profiles, the welcome
SHALL end with "In the meantime, follow us on LinkedIn to stay connected.",
linking to it. Without one, the line SHALL be left out.

#### Scenario: LinkedIn set

- **WHEN** a LinkedIn profile is set and a member is welcomed
- **THEN** the email invites them to follow the network on LinkedIn, linked to that profile

#### Scenario: No LinkedIn

- **WHEN** no LinkedIn profile is set
- **THEN** the email has no LinkedIn line

### Requirement: The welcome's outcome is recorded

The member SHALL record how the welcome went: sent, failed, unconfigured, not
verified (no Turnstile pass) or skipped (development), readable but not
editable in the admin. A failed or unconfigured send SHALL be logged as an
error naming the member's id and no personal data.

#### Scenario: Resend fails

- **WHEN** Resend fails or does not answer within the timeout
- **THEN** the member stays saved, records "failed", and an error is logged without the address

#### Scenario: Not verified

- **WHEN** a sign-up had no Turnstile pass
- **THEN** the member records "not verified"

#### Scenario: Existing members

- **WHEN** the admin shows a member who joined before this change
- **THEN** the field is empty, and no welcome is sent to them
