# Spec Delta

## Purpose

Lets the team publish the network's events and its founder's speaking
engagements from the CMS, and shows them on /events, with a page for each event
the network hosts.

## ADDED Requirements

### Requirement: Two kinds of event

Every event SHALL be either Speaking (someone from the network speaking at an
external event, booked through the organiser) or Hosted (run by the network,
booked on this site). Only hosted events SHALL offer RSVP. A speaking event
SHALL link to the organiser when an organiser URL is set.

#### Scenario: Speaking event with an organiser link

- **WHEN** a visitor views a published speaking event that has an organiser URL
- **THEN** it links to the organiser's site, opening in a new tab, and shows no RSVP

#### Scenario: Speaking event without an organiser link yet

- **WHEN** a published speaking event has no organiser URL
- **THEN** it is listed with its details and is not a link

#### Scenario: Organiser URL not https

- **WHEN** an editor enters an organiser URL that does not start with https://
- **THEN** the save is refused

### Requirement: Event details

An event SHALL have a title, a start date and time in a named time zone, an
optional end, a venue and city (or "Online"), and one or more speakers, each
with a name and, for speaking events, a role (keynote, panel, talk or
"to be confirmed"). A session title SHALL be optional and shown as "Topic to be
confirmed" when absent.

#### Scenario: Time shown in the event's own zone

- **WHEN** an event starts at 11:40 in Europe/Amsterdam
- **THEN** /events shows 11:40 with the zone's abbreviation, whatever the visitor's or server's zone

#### Scenario: Topic not yet known

- **WHEN** a speaking event has no session title
- **THEN** its card says "Topic to be confirmed"

#### Scenario: Multi-day event

- **WHEN** an event runs from 11 to 12 November 2026
- **THEN** its card shows the date range, not a single day

### Requirement: Only published events are public

An event SHALL appear on the site only when its status is Published. Draft and
cancelled events SHALL NOT be listed or reachable, except that a cancelled
hosted event's page SHALL say it is cancelled to anyone holding its link.

#### Scenario: Draft event

- **WHEN** an event is saved as a draft
- **THEN** it is absent from /events and /sitemap.xml, and its page answers 404

#### Scenario: Cancelled hosted event

- **WHEN** a published hosted event is cancelled
- **THEN** it leaves /events and its page says it is cancelled, with no RSVP form

### Requirement: The events page

/events SHALL list upcoming published events soonest first, then past events
most recent first under a "Past events" heading. An event SHALL count as past
once its end (or, without one, its start) has passed. With nothing upcoming, the
page SHALL say "Events – coming soon." and invite visitors to sign up.

#### Scenario: Seeded events

- **WHEN** a visitor opens /events on 20 October 2026 with the seeded events
- **THEN** they see Field Service Europe 2026, Revive ME 2026 and Service Next Medical 2027, in that order

#### Scenario: Nothing upcoming

- **WHEN** every published event is past
- **THEN** the page shows "Events – coming soon.", a sign-up link and the past events

#### Scenario: Editor publishes an event

- **WHEN** an editor publishes an event
- **THEN** the next request to /events includes it

### Requirement: Hosted event page

Each published hosted event SHALL have a page at /events/<slug> showing its
details, its description and its RSVP state, with a canonical URL, a title and
description, and an entry in /sitemap.xml while it is upcoming.

#### Scenario: Slug from the title

- **WHEN** an editor creates "Winter Speakeasy" without a slug
- **THEN** the event is given the slug `winter-speakeasy`, and the slug is unique

### Requirement: Navigation links to events

The header, mobile menu and footer SHALL link "Events" to /events, marked as
current on /events and on any event page.

#### Scenario: Current page

- **WHEN** a visitor is on /events/winter-speakeasy
- **THEN** the Events link carries aria-current="page"
