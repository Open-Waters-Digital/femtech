## Purpose

Measures how the site is used, as aggregate statistics that feed the Open Waters
Digital Dividend report, using the shared Open Waters event list. It never
identifies or profiles a visitor, and never records what anyone types.

## ADDED Requirements

### Requirement: Measurement runs only where it is meant to

The site SHALL send analytics only from a production build, served on the
canonical host, with both the analytics project key and the ingestion host
configured. It SHALL send nothing from a development build, from a build without
the key or host (including one where either is set to an empty string), from a
preview host such as Railway's, from inside an iframe, or from a page marked
`noindex`.

#### Scenario: Production with configuration

- **WHEN** a visitor loads an indexable page of a production build that has both
  values set
- **THEN** analytics loads and a page view is recorded

#### Scenario: Unconfigured build

- **WHEN** the production build was made without the key, or with an empty one
- **THEN** no analytics script loads, no analytics request is made, and the
  console shows no error

#### Scenario: Development build

- **WHEN** the site runs in development with production values copied into the
  local environment
- **THEN** no analytics request is made

#### Scenario: Internal showcase

- **WHEN** a visitor loads `/design-system`
- **THEN** no analytics request is made

### Requirement: Analytics stays off the critical path

The analytics library SHALL NOT load until the page has finished loading and the
browser is idle. A visitor's interaction before then SHALL be queued and sent
once it loads, up to a fixed cap. Analytics SHALL NOT delay rendering, and
SHALL NOT cause a console error even if the analytics service is unreachable.

#### Scenario: Early click

- **WHEN** a visitor clicks a tracked call to action before analytics has loaded
- **THEN** the event is sent once analytics loads

#### Scenario: Service unreachable

- **WHEN** the ingestion host is down or blocked
- **THEN** the page works as normal and no error reaches the console

### Requirement: No cookies, no identification, no recording

Analytics SHALL set no cookies and SHALL NOT identify, alias or build a profile
of any visitor. Session recording and heatmaps SHALL be off. Forms SHALL be excluded from
automatic capture. The only
things stored are the visit's landing page and referring site, in session
storage until the tab closes, so a sign-up can be attributed to its channel;
and a visitor's objection, in local storage, only after the visitor has used the
objection control.

#### Scenario: Fresh visit

- **WHEN** a visitor with a clean browser profile loads any page and clicks
  around
- **THEN** the browser holds no cookies for the site and nothing in local
  storage, and session storage holds only the visit's attribution

#### Scenario: No replay

- **WHEN** any page is loaded
- **THEN** no session recording script is requested and no recording is sent

### Requirement: No personal data in any event

No analytics event, browser or server, SHALL contain a name, email address,
phone number, organisation, message text, or any other value a visitor typed or
chose in a form. Form events SHALL carry field **names** only. Outbound links
SHALL be reported by hostname only, never by full URL.

#### Scenario: Form interaction

- **WHEN** a visitor fills in and submits the sign-up form
- **THEN** no event property contains any value they entered

#### Scenario: Validation error

- **WHEN** a field fails validation and its error is shown
- **THEN** the event names the field and the error class (`required`, `format`,
  `too_long` or `server`) and nothing else about it

### Requirement: Every event carries the shared context

Every event SHALL carry `site` = `femtech` and the event-list taxonomy version.
Every browser event SHALL also carry `page_type`, one of the event list's page
types, taken from the page. Home is `home`; `/about-us` is `about`; `/sign-up`
is `contact`; `/events` is `listing`; an event's page and every other page are
`other`. A page reached by client-side navigation SHALL be recorded as a page
view with its own page type.

#### Scenario: Navigating within the site

- **WHEN** a visitor on `/` follows the header's link to `/about-us`
- **THEN** a page view for `/about-us` is sent carrying `site` = `femtech`, the
  taxonomy version, and `page_type` = `about`

#### Scenario: Every page declares its type

- **WHEN** the site is built
- **THEN** every page declares a page type, and the build fails for a page that
  does not

### Requirement: Calls to action are counted by stable id

Every call to action that invites a visitor to join, and an event's RSVP
button, SHALL send `cta_clicked` with a stable `cta_id`, its visible label as
`cta_text`, and a `cta_location`. The id SHALL NOT change when the label
changes.

#### Scenario: Header join

- **WHEN** a visitor activates the header's join link
- **THEN** `cta_clicked` is sent with `cta_id` = `join` and the header's
  location, and the visitor reaches `/sign-up`

#### Scenario: Same action, different place

- **WHEN** a visitor activates a join link further down the page instead of the
  header's
- **THEN** `cta_clicked` carries a different `cta_location` from the header
  control's, so the two can be told apart

### Requirement: Contact links and scroll depth are counted

Activating a `tel:` or `mailto:` link SHALL send `contact_link_clicked` with the
channel (`phone` or `email`) and its location. A link to another hostname SHALL
send `outbound_link_clicked`. Each page SHALL send `scroll_depth_reached` the
first time the visitor passes 25, 50, 75 and 100% of it.

#### Scenario: Telephone link

- **WHEN** a visitor activates the footer's email address
- **THEN** `contact_link_clicked` is sent with `channel` = `email`

#### Scenario: Depth reported once

- **WHEN** a visitor scrolls past halfway, back up, and past halfway again
- **THEN** `scroll_depth_reached` for 50 is sent once

### Requirement: The sign-up funnel is measured

Each form SHALL be identified by a stable form id: `signup` for the sign-up
form and `rsvp` for an event's RSVP form. The site SHALL send `form_started` on
the first focus inside a form; `form_error_shown` whenever a field error is
displayed; `form_submitted` when the server confirms a submission; and
`form_abandoned` when the visitor leaves the page after starting a form without
submitting it, carrying the last field's name and a count of fields typed in.

#### Scenario: Completed sign-up

- **WHEN** a visitor fills in the sign-up form and submits it successfully
- **THEN** `form_started` and then `form_submitted` are sent with `form_id` =
  `signup`, and no `form_abandoned` follows

#### Scenario: Abandoned RSVP

- **WHEN** a visitor types into an RSVP form's email field and leaves the page
  without submitting
- **THEN** `form_abandoned` is sent with `form_id` = `rsvp` and `last_field` =
  `email`

### Requirement: Sign-ups are counted on the server

When a sign-up has been saved, the server SHALL send `lead_submitted` with
`form_id` = `signup`, `lead_type` = `membership`, and the visit's `channel`
classified from the attribution the form sent (`unknown` when there is none),
with the attribution's landing source fields. Nothing a person typed SHALL be
among them. The event SHALL NOT delay, fail or alter the sign-up, its response
or its emails. No lead event SHALL be sent for a sign-up that was rejected or
silently dropped as a bot, nor for an RSVP.

#### Scenario: Saved sign-up

- **WHEN** a visitor who arrived from a search engine signs up
- **THEN** `lead_submitted` is sent with `form_id` = `signup`, `lead_type` =
  `membership` and `channel` = `organic_search`

#### Scenario: Analytics broken

- **WHEN** the analytics key is wrong or the service is unreachable and a valid
  sign-up is submitted
- **THEN** the member is saved, the welcome email is sent, and the visitor gets
  the normal response

#### Scenario: An RSVP

- **WHEN** a visitor RSVPs to an event
- **THEN** no `lead_submitted` is sent

### Requirement: A visitor can object to measurement

`/privacy` SHALL offer a control that stops the visitor's visits being measured,
beside the privacy page's own words about measurement. The site SHALL NOT be
configured to measure until it is there.
Once used, no analytics SHALL load on any page of the site in that browser,
including after a reload, until the visitor reverses it with the same control.
The control SHALL show which state the visitor is in. It SHALL work by keyboard
and meet the site's 44px target and focus rules.

#### Scenario: Objecting

- **WHEN** a visitor uses the control on `/privacy` and then visits `/about-us`
- **THEN** no analytics request is made on either page

#### Scenario: Reversing

- **WHEN** a visitor who has objected uses the control again
- **THEN** analytics loads again from the next page load

#### Scenario: Script unavailable

- **WHEN** `/privacy` is loaded without JavaScript
- **THEN** the control is shown as unavailable, with a line explaining that
  nothing is measured without JavaScript, rather than as a button that does
  nothing

#### Scenario: Without the objection

- **WHEN** a visitor has never used the control
- **THEN** the site stores nothing on their device for analytics
