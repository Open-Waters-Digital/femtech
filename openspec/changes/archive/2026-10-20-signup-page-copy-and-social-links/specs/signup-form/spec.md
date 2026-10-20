# Spec Delta

## Purpose

Defines what a sign-up collects, how the form and the server validate it with
one set of rules, what is stored on the member, and what the team is told.

## ADDED Requirements

### Requirement: Sign-up fields

The sign-up form SHALL collect first name, last name, email address, job title
and industry as required fields, and phone number and organisation as optional
fields. It SHALL NOT offer a free-text message field.

#### Scenario: All required fields given

- **WHEN** a visitor submits first name, last name, a valid email address, a job title, an industry and the ticked consent box
- **THEN** the sign-up is accepted and saved as a member with those values

#### Scenario: Optional fields left empty

- **WHEN** a visitor leaves phone number and organisation empty
- **THEN** the sign-up is accepted and those fields are stored empty

#### Scenario: Job title missing

- **WHEN** a visitor submits without a job title
- **THEN** the sign-up is refused with an error on the job title field, and nothing is saved

### Requirement: Industry is one of a fixed list

Industry SHALL be one of: Healthcare provider / clinical; Healthcare
technology; Digital health / HealthTech startup; Women’s health / FemTech; Life
sciences / pharma / medtech; Investment / venture capital; NHS / public sector;
Consulting / advisory; Academia / research; Other. The form and the server
SHALL accept exactly this list.

#### Scenario: Industry not chosen

- **WHEN** a visitor submits with no industry selected
- **THEN** the sign-up is refused with an error on the industry field

#### Scenario: Industry outside the list

- **WHEN** a request to /join carries an industry value that is not in the list
- **THEN** the sign-up is refused and nothing is saved

### Requirement: Consent to updates is required

The form SHALL show the checkbox "I’d like to receive updates from FemTech
Healthcare Network about events, membership and products. I can unsubscribe at
any time." as required. A sign-up without it ticked SHALL be refused by the form
and by /join alike.

#### Scenario: Consent not ticked, with JavaScript

- **WHEN** a visitor submits with the box unticked
- **THEN** the form shows an error on the checkbox, moves focus to it, and does not post

#### Scenario: Consent not ticked, without JavaScript or from a crafted post

- **WHEN** /join receives an otherwise valid sign-up without the consent field
- **THEN** it refuses the sign-up as invalid and saves nothing

#### Scenario: Consent recorded

- **WHEN** a sign-up is accepted
- **THEN** the new member is stored as agreeing to emails

### Requirement: Field limits

Job title SHALL be at most 120 characters and organisation at most 200, in the
form and on the server. Existing limits for name, email and phone SHALL be
unchanged.

#### Scenario: Job title too long

- **WHEN** a request to /join carries a job title of 121 characters
- **THEN** the sign-up is refused with an error on the job title field

### Requirement: Existing members stay valid

Members saved before this change, and members added by hand in the admin,
SHALL remain valid without a job title, organisation or industry. Any message
already stored SHALL remain visible in the admin.

#### Scenario: Older member edited in the admin

- **WHEN** an editor opens and saves a member who has no job title or industry
- **THEN** the save succeeds

### Requirement: Repeat sign-ups do not change the member

A sign-up from an email address already on the list SHALL NOT change any
stored field of that member, including the new ones. The visitor SHALL get the
same answer as a new member.

#### Scenario: Repeat with a different job title

- **WHEN** someone signs up again with an existing address and a new job title
- **THEN** the stored job title is unchanged and the visitor sees the usual thank-you

### Requirement: The team's notification lists the new fields

The email to the team SHALL show job title, organisation and industry (the
industry by its label), escaped like every other value, and SHALL NOT include a
message row.

#### Scenario: Notification for a new sign-up

- **WHEN** a sign-up is accepted and the team is emailed
- **THEN** the email shows the job title, the organisation (or a dash when empty) and the industry label

#### Scenario: Markup in a job title

- **WHEN** the job title contains `<script>`
- **THEN** the email shows it as text, not markup

### Requirement: No personal data in logs

Logging from /join SHALL NOT include job title, organisation or industry, as
for every other submitted field.

#### Scenario: Save failure

- **WHEN** saving a sign-up fails
- **THEN** the log line names the layer and the outcome only
