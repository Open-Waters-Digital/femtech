# event-rsvp Specification

## Purpose
Lets visitors reserve a place at an event the network hosts, receive a
confirmation by email, and withdraw, without accounts and without an external
events service.

## Requirements

### Requirement: RSVP form

A hosted event's page SHALL offer an RSVP form, while RSVP is open, asking for
first name, last name and email address. It SHALL be validated by one shared
schema in the form and on the server.

#### Scenario: Successful RSVP

- **WHEN** a visitor submits valid details and passes the bot check
- **THEN** a registration is saved for that event and email address, and the page confirms the place in place

#### Scenario: Invalid email

- **WHEN** a visitor submits an invalid email address
- **THEN** the form shows an error on the email field and nothing is saved

### Requirement: Bot defences

The RSVP endpoint SHALL apply, cheapest first: a per-IP rate limit, a honeypot
field, a signed dwell token, a server-side Turnstile verification with a
timeout, and the schema. A bot rejection SHALL answer as success does, except a
failed Turnstile check, which SHALL ask the visitor to try again.

#### Scenario: Honeypot filled

- **WHEN** a request fills the honeypot
- **THEN** it gets the success answer, and nothing is saved or emailed

#### Scenario: Turnstile token missing or invalid

- **WHEN** a request carries no valid Turnstile token
- **THEN** nothing is saved or emailed, and the visitor is asked to try again

#### Scenario: Turnstile unconfigured or unreachable in production

- **WHEN** the secret is missing or the verify call fails or times out
- **THEN** the RSVP is refused, nothing is saved, and an error is logged naming the layer only

### Requirement: Without JavaScript

The page SHALL tell a visitor without JavaScript that RSVP needs it, and SHALL
give the team's contact address instead of a form that cannot succeed.

#### Scenario: JavaScript disabled

- **WHEN** a visitor opens a hosted event's page without JavaScript
- **THEN** they see the event details, the explanation and the contact address, and no submit button

### Requirement: One registration per person per event

Registrations SHALL be unique per event and lower-cased email address. A repeat
RSVP SHALL NOT change the stored details. It SHALL resend the confirmation and
SHALL get the same answer as a new one.

#### Scenario: RSVP twice

- **WHEN** someone RSVPs again with the same email address
- **THEN** no second registration exists, the stored name is unchanged, the confirmation is sent again, and the page shows the usual confirmation

#### Scenario: RSVP again after withdrawing

- **WHEN** someone who withdrew RSVPs again while places remain
- **THEN** their registration is confirmed again and counts against capacity

### Requirement: Capacity and closing

RSVP SHALL be open only while the event is published, not cancelled, not
started, before its RSVP closing time if set, and with fewer confirmed
registrations than its capacity if set. The page SHALL say why when RSVP is
closed.

#### Scenario: Last place

- **WHEN** an event with a capacity of 20 has 19 confirmed registrations and two people RSVP at the same moment
- **THEN** exactly one is confirmed, and the other is told the event is full

#### Scenario: Event full

- **WHEN** capacity is reached
- **THEN** the page says the event is full and shows no form

#### Scenario: Closing time passed

- **WHEN** the RSVP closing time has passed
- **THEN** the page says RSVP has closed, and a direct post is refused

### Requirement: Confirmation email

On a confirmed RSVP, the registrant SHALL be emailed, after the response, from
the configured sending address. The email SHALL give the event title, date, time
and zone, venue and a withdraw link, with every value escaped. The send result
SHALL be recorded on the registration.

#### Scenario: Email sent

- **WHEN** an RSVP is confirmed and Resend accepts the message
- **THEN** the registrant receives it and the registration records "sent"

#### Scenario: Email fails

- **WHEN** Resend fails or times out
- **THEN** the registration stands, records "failed", and an error is logged without the address

#### Scenario: Header injection

- **WHEN** a first name contains a line break and a header
- **THEN** the subject line contains no line break

### Requirement: Withdrawing

The withdraw link SHALL open a page naming the event, with a Withdraw button.
Only a POST with a valid signed token SHALL mark that one registration
withdrawn, and the place SHALL then be free. Opening the link SHALL change
nothing.

#### Scenario: Link opened by a mail scanner

- **WHEN** the withdraw link is fetched with GET
- **THEN** the registration is unchanged

#### Scenario: Withdraw

- **WHEN** the registrant presses Withdraw
- **THEN** the registration is marked withdrawn, and the page confirms it

#### Scenario: Tampered token

- **WHEN** a token is edited or signed with another secret
- **THEN** nothing changes, and the page says the link is not valid

#### Scenario: Event already over

- **WHEN** the token is for an event that has ended
- **THEN** the page says the event has passed, and nothing changes

### Requirement: Registrations are private

Registrations SHALL be readable and editable only by signed-in editors. Each
SHALL be linked to the member with the same email when one exists. RSVPing
SHALL NOT add anyone to the members list. No name or email SHALL be logged.

#### Scenario: Public API

- **WHEN** an anonymous request asks the REST or GraphQL API for event registrations
- **THEN** it is refused

#### Scenario: Member attends

- **WHEN** a member RSVPs with their member email address
- **THEN** the registration links to their member record, and the member record is unchanged

### Requirement: Attendance in the admin

The admin SHALL show each hosted event's confirmed count against its capacity,
and the registrations for an event, filterable by status.

#### Scenario: Editor checks numbers

- **WHEN** an editor opens a hosted event in the admin
- **THEN** they see the number of confirmed places and the capacity
