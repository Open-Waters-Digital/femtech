# Spec Delta

## Purpose

Gives every email the site sends the same brand and structure (the mark, the
cream ground, the type, the footer), with a plain-text part and every value
escaped, so no email looks bare and none can forget the safety rules.

## ADDED Requirements

### Requirement: Every email uses the branded layout

Every email the site sends (the team's sign-up notification, the RSVP
confirmation and the welcome email) SHALL be rendered in one shared layout: the
mark at the top, linked to the site; a cream ground with ink text; a serif
heading; and a footer with the network's name and the site's address.

#### Scenario: Team notification

- **WHEN** the team is emailed about a sign-up
- **THEN** the email shows the mark, the cream ground and the footer, with the member's details in the body

#### Scenario: RSVP confirmation

- **WHEN** a registrant is emailed their confirmation
- **THEN** the email shows the same mark, ground and footer, and says what it said before this change

### Requirement: Renders in common mail clients

The layout SHALL use only table layout and inline styles, SHALL NOT depend on
web fonts, external stylesheets or scripts, and SHALL stay readable at 320px
wide.

#### Scenario: Web fonts unavailable

- **WHEN** a mail client does not load Zodiak or Cabinet Grotesk
- **THEN** headings show in a serif fallback and body text in a sans-serif fallback

#### Scenario: Narrow screen

- **WHEN** the email is read on a phone 320px wide
- **THEN** the content fits the width without horizontal scrolling

#### Scenario: Images blocked

- **WHEN** the mail client blocks images
- **THEN** the mark's alt text reads "FemTech Healthcare Network" and the email still reads in full

### Requirement: A plain-text part

Every email SHALL carry a plain-text part with the same content as the HTML,
links written out in full.

#### Scenario: Text-only client

- **WHEN** an email is opened in a client that shows only plain text
- **THEN** every paragraph and link of the HTML part is present as text

### Requirement: Values are escaped

Every value from a visitor or an editor SHALL be HTML-escaped in the HTML part
and stripped of line breaks wherever it reaches a header such as the subject.

#### Scenario: Markup in a value

- **WHEN** a name or an editor's copy contains `<script>`
- **THEN** it appears as text in the email and no element is created

#### Scenario: Line break in a subject value

- **WHEN** a value placed in the subject contains CR or LF
- **THEN** the subject is a single line

### Requirement: Emails on the showcase

`/design-system` SHALL show the email layout and the design of each email
(team notification, RSVP confirmation, welcome) through the same renderer the
sends use, with placeholder copy.

#### Scenario: Reviewing the emails

- **WHEN** a developer opens `/design-system` locally
- **THEN** each email is shown in a frame at a phone width and at a desktop width, with no script running in the frame
