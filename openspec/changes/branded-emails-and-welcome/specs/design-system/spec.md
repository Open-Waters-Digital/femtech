# Spec Delta

## Purpose

The living showcase of tokens, primitives, components and emails at
`/design-system`: a development tool, reachable only on a local machine.

## ADDED Requirements

### Requirement: The showcase is local only

`/design-system` SHALL render only in local development. On every deployed
environment, production and preview alike, it SHALL answer with the site's
404 page and reveal none of its content.

#### Scenario: Production

- **WHEN** anyone requests `/design-system` on https://www.femtechhealth.com
- **THEN** the response is the site's 404 page with status 404

#### Scenario: Preview

- **WHEN** anyone requests `/design-system` on a preview deployment
- **THEN** the response is the site's 404 page with status 404

#### Scenario: Local

- **WHEN** a developer runs the site locally and opens `/design-system`
- **THEN** the showcase renders
