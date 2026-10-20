# Spec Delta

## Purpose

Lets the team set the network's social profiles once, in the CMS, and have the
site link to them wherever they are shown, without a deploy.

## ADDED Requirements

### Requirement: Profiles configured in site settings

Site settings SHALL hold an ordered list of social profiles, each a platform
(LinkedIn, Instagram, Facebook or X) and a URL, editable only by a signed-in
editor.

#### Scenario: Editor adds LinkedIn

- **WHEN** an editor adds a LinkedIn profile URL and saves
- **THEN** the next request to any page links to it where profiles are shown

### Requirement: Profile URLs are checked

A profile URL SHALL be an https address on its platform's host
(linkedin.com, instagram.com, facebook.com, x.com or twitter.com, with or
without a subdomain). Any other URL SHALL be refused by the admin with a
message saying what is expected.

#### Scenario: Wrong host

- **WHEN** an editor enters `https://example.com/femtech` for LinkedIn
- **THEN** the save is refused with a message asking for a linkedin.com address

#### Scenario: Not https

- **WHEN** an editor enters `http://www.linkedin.com/company/femtech`
- **THEN** the save is refused

### Requirement: Profiles in the footer

The footer on every page SHALL show the profiles as a row of platform marks in
the order configured, each a link at least 44 by 44 pixels whose accessible
name is the platform's name. The row SHALL NOT render when there are no
profiles.

#### Scenario: Two profiles

- **WHEN** site settings hold LinkedIn and Instagram
- **THEN** the footer shows the two marks in that order, announced as "LinkedIn" and "Instagram"

#### Scenario: No profiles

- **WHEN** the list is empty
- **THEN** the footer shows no social row and no empty space for one

### Requirement: Marks follow their ground

The marks SHALL be drawn in the colour of the text they sit in, not in the
platforms' brand colours, and SHALL show a visible focus ring on every ground.

#### Scenario: Keyboard focus

- **WHEN** a keyboard user tabs to a mark
- **THEN** a visible focus ring surrounds it
