## Purpose

How the Payload admin presents itself to the network's team: as FemTech's own
tool, in the site's cream-and-ink palette, type and marks, rather than as
Payload's.

## ADDED Requirements

### Requirement: The admin's marks

The admin sign-in page SHALL show the femtech wordmark and heart mark in place
of Payload's logo, and the admin navigation SHALL show the heart mark in place
of Payload's icon. The mark SHALL be drawn from the site's own mark file, and
both SHALL carry the accessible name "FemTech Healthcare Network".

The sign-in lockup SHALL fit a 390px screen without horizontal scroll.

#### Scenario: The sign-in page

- **WHEN** a signed-out visitor opens `/admin/login`
- **THEN** the femtech wordmark and mark are shown and no Payload logo is present

#### Scenario: The navigation

- **WHEN** a signed-in editor opens the admin
- **THEN** the navigation shows the heart mark and no Payload icon

#### Scenario: A phone

- **WHEN** the sign-in page is viewed at 390px
- **THEN** the lockup is fully visible and the page does not scroll sideways

### Requirement: The admin's palette and type

The admin SHALL take its ground, text, borders, elevation steps and status
colours from the site's design tokens, and its stylesheet SHALL contain no
colour literal. Its body type SHALL be Cabinet Grotesk from the site's
self-hosted files, and it SHALL load no font from a third party.

Body text and field help text SHALL each measure at least 4.5:1 against their
ground, and focus SHALL remain visible on every control.

#### Scenario: Ground and text

- **WHEN** any admin page is rendered
- **THEN** its background is the site's cream surface and its body text is the
  site's ink

#### Scenario: No copied colours

- **WHEN** the admin stylesheet source is read
- **THEN** it contains no hex, `rgb()` or `hsl()` colour literal

#### Scenario: Type

- **WHEN** any admin page is rendered
- **THEN** its body text is set in Cabinet Grotesk and no font request leaves the
  site's own origin

#### Scenario: Contrast and focus

- **WHEN** a keyboard user tabs through the sign-in form and the edit view of a
  member
- **THEN** every focused control shows a visible indicator, and body and help
  text each measure at least 4.5:1

### Requirement: The admin is light only

The admin SHALL render in its light theme only and SHALL NOT offer a theme
choice. The site has no dark palette, so a dark admin would have to invent one.

#### Scenario: A dark operating system

- **WHEN** an editor whose operating system prefers a dark colour scheme opens
  the admin
- **THEN** the admin renders in the light, on-brand palette

#### Scenario: No theme switch

- **WHEN** an editor opens their account settings
- **THEN** no theme choice is offered

### Requirement: The admin's tab and share metadata

Every admin page title SHALL end with "FemTech Healthcare Network" and SHALL NOT
name Payload. Admin pages SHALL show the site's icon, SHALL name the network as
the Open Graph site name, SHALL carry no generated Open Graph image, and SHALL
remain closed to indexing.

#### Scenario: The tab

- **WHEN** an editor opens any admin page
- **THEN** the tab's title ends "FemTech Healthcare Network" and its icon is the
  site's icon

#### Scenario: No Payload share card

- **WHEN** `/admin/login` is fetched
- **THEN** its head names the network as `og:site_name`, carries no `og:image`
  from Payload's image endpoint, and declares `noindex`
