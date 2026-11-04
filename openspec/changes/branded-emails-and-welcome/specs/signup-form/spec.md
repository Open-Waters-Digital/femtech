# Spec Delta

## ADDED Requirements

### Requirement: The form carries a Turnstile check

With JavaScript, the sign-up form SHALL show a Cloudflare Turnstile check once
it is on screen and send its token with the sign-up. If the check cannot load,
the form SHALL still submit, without a token. The check SHALL NOT be a reason
the server refuses a sign-up.

#### Scenario: Check passes

- **WHEN** a visitor with JavaScript completes the form and the check
- **THEN** the sign-up is sent with the check's token

#### Scenario: Check blocked

- **WHEN** the Turnstile script is blocked or fails to load
- **THEN** the visitor can still submit and becomes a member

#### Scenario: Check still running

- **WHEN** the visitor submits before the invisible check has produced a token
- **THEN** the form waits up to 5 seconds for it, then sends, with the token if it arrived and without it otherwise

#### Scenario: Check wants a tick

- **WHEN** Cloudflare asks the visitor to tick the box and they submit without doing so
- **THEN** the form asks them to complete the check above the button, and nothing is sent

### Requirement: The team is told whether the member was welcomed

The welcome SHALL be attempted before the team is emailed, and the team's
notification for a new member SHALL give its outcome: sent, failed, not sent
because the check did not pass, or not configured. A repeat sign-up's
notification SHALL say that no welcome was sent.

#### Scenario: Welcomed

- **WHEN** a new member's check passed and Resend accepted the welcome
- **THEN** the team's email says the welcome email was sent

#### Scenario: Not verified

- **WHEN** a new member had no Turnstile pass
- **THEN** the team's email says no welcome was sent because the check did not pass, so the team can write to them by hand

#### Scenario: Welcome failed

- **WHEN** the welcome send failed
- **THEN** the team's email says it failed, and the team is still emailed

#### Scenario: Repeat

- **WHEN** the sign-up was a repeat
- **THEN** the team's email says no welcome was sent because they were already a member
