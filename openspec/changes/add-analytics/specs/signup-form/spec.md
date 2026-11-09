## ADDED Requirements

### Requirement: A sign-up carries its channel

The sign-up form SHALL send the visit's attribution — its landing page and
referring site, as the analytics package records them — as an optional field
of at most 2048 characters. The server SHALL use it only to classify the
sign-up's channel for the lead event: it SHALL NOT store it on the member, put
it in any email, or log it. A missing, empty or malformed value SHALL classify
as `unknown` and SHALL NOT reject the sign-up, and a value over the limit SHALL
be rejected like any other over-long field.

#### Scenario: Not stored

- **WHEN** a visitor signs up with attribution present
- **THEN** the saved member, the team's notification and the welcome email
  contain no trace of it

#### Scenario: Signing up without script

- **WHEN** the form is posted without JavaScript, so the field is empty
- **THEN** the sign-up succeeds and its lead event carries `channel` =
  `unknown`
