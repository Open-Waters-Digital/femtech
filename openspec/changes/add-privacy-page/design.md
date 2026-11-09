## Context

The site collects members (sign-up) and event registrations (RSVP), sends
email through Resend, checks people with Turnstile, and will measure visits
with cookieless PostHog once a privacy page names it. There is no privacy page,
and the Webflow site had none. Open Waters drafts this one, after
luxury-gardens' policy, for the network to approve.

## Goals / Non-Goals

**Goals:** a policy page the network can edit and publish; an accurate account
of what this site actually does; the objection control on it; links from every
form, only once it is published.

**Non-Goals:** cookie banner (the site sets no cookies); terms and conditions;
changing the required updates checkbox (an open question the draft describes
as it is); deciding retention for the client.

## Decisions

### D1. A global with structured sections, not rich text

`privacyPolicy`: `title`, `effectiveDate`, `metaDescription`, and `sections`
(array of `heading` + `blocks`, with blocks `paragraph`, `subheading`, `list`
of items, `analyticsObjection` with optional labels). Drafts on, as the Payload
pattern for public content.

Luxury-gardens uses a Lexical body with a custom block. This site has no rich
text anywhere, its globals are textareas and arrays, and Radara's notice uses
exactly this block set — so the objection control is a block an editor places,
not a node inside rich text, and section numbers come from position.
_Rejected:_ code-only copy (the network could not edit its own policy);
Lexical (a second editing model on a site that has one).

### D2. `/privacy-policy`, 404 until published

The luxury-gardens path. The route reads the published global (draft mode for
an editor), returns `notFound()` when it has never been published, and is
revalidated by the global's `afterChange` with the sitemap.

### D3. Links follow publication

`PRIVACY_PATH` stays the switch, but becomes "is a published policy present",
read once at render in the layout and passed down, so the sign-up form, the
RSVP form and the footer cannot link to a 404. `navigation.ts` keeps the path
constant.

### D4. The seed creates a draft, never publishes

`scripts/seed.ts` writes the drafted policy below as a draft only when the
global is empty. Placeholders in square brackets are deliberate and visible in
the admin, so nobody publishes a policy with a fact missing without seeing it.

## Risks / Trade-offs

- **Drafted legal copy** → it is labelled a draft in this change, in the seed
  and in AGENTS.md, and publishing is the network's act in the admin.
- **The required updates checkbox** may not be valid consent (Open questions).
  The draft states the lawful basis as consent and says how to withdraw it;
  if the client changes the checkbox, section 4 changes with it.
- **Retention left to the client** → bracketed proposals, not silence: a
  policy without retention periods is incomplete.

## Drafted policy (the seed)

Bracketed text is for the client to supply or confirm.

**Title:** Privacy policy
**Meta description:** How FemTech Healthcare Network collects, uses and
protects your information, and the rights you have.

**Intro (section without a number):**
This policy explains how FemTech Healthcare Network ("we", "us") collects, uses
and protects your information when you visit our website, become a member or
register for one of our events. FemTech Healthcare Network is [legal entity
name], [registered in England and Wales, company number …], registered office
[address]. We are the controller of the information described here.

**1. Information we collect**
- When you become a member: your first and last name, email address, job
  title and industry, and, if you give them, your telephone number and
  organisation; that you agreed to hear from us; and when you joined.
- When you register for one of our events: your first and last name, email
  address, the event, and when you registered or withdrew.
- When you visit our website: your IP address, and how the website is used,
  measured without cookies and without identifying you (see section 6).

**2. How we use your information**
- To welcome you as a member and send you news of the network, its events and
  opportunities, as you agreed when you joined
- To manage your place at an event, confirm it, and let you withdraw
- To understand who the network reaches, in aggregate
- To keep our forms free of automated abuse
- To improve our website
- To meet legal obligations

**3. Why we are allowed to use it**
- Member updates: your consent, given when you joined. You can withdraw it at
  any time by replying to any email from us or writing to [rights address],
  and we will remove you from the list.
- Event registrations: the steps you ask us to take to give you a place.
- Visitor statistics: our legitimate interest in understanding how our website
  is used, measured without cookies and without identifying you. You can
  object at any time with the button in section 6.
- The spam check and the limits on how often a form can be sent: our
  legitimate interest in keeping our forms free of abuse.

**4. Who we share it with**
We do not sell or rent your information. We share it only with providers who
run the website for us: Railway, which hosts the website and stores members
and registrations; Resend, which sends our emails, including the one telling
our team about a new member; Cloudflare Turnstile, which checks that a form is
sent by a person rather than a bot; and PostHog, which provides our visitor
statistics. We may also share information where the law requires it.

Railway stores our data in [the European Union — confirm region], and PostHog
keeps our visitor statistics in the European Union; UK law recognises both as
protecting your information to the same standard as the UK. Resend and
Cloudflare are American companies and may handle your information in the
United States; where they do, it is protected by the safeguards UK law
requires, set out in each provider's data processing terms.

**5. How long we keep it**
- Members: for as long as you are a member. If you ask to leave, we remove
  your details [within one month].
- Event registrations: [twelve months after the event], then deleted.
- Emails to our team about new members: deleted in the course of managing our
  inbox.

**6. Cookies and visitor statistics**
Our website sets no cookies.

We measure visits with PostHog, hosted in the European Union, in a mode that
sets no cookies and does not identify you. It records the pages viewed, the
buttons and links selected, how far a visit got through our forms and which
questions needed correcting, and which website or campaign brought the visit.
It never records anything you type, and it does not record your screen. Its
traffic reaches PostHog through an address on our own domain.

Your browser keeps two small items for us. While a tab is open, it remembers
which website or campaign brought you, so that joining can be credited to it;
this is removed when you close the tab, and it is never stored with your
membership. And if you choose not to be measured, that choice is kept in your
browser until you change it.

You can choose not to be measured at any time:
[objection control]

**7. Keeping it safe**
We use appropriate technical and organisational measures to protect your
information against unauthorised access, loss or misuse. Only our team can see
members and registrations, in our website's password-protected admin.

**8. Your rights**
Under UK data protection law, you have the right to:
- Ask for a copy of the information we hold about you, and have it corrected
  or deleted
- Withdraw your consent to member updates at any time
- Object to our using your information, including for our visitor statistics
- Receive the information you gave us in a form you can take elsewhere
- Complain to the Information Commissioner's Office (ico.org.uk)

To exercise any of them, write to [rights address]. We will reply within one
month.

**9. Children**
Our website and membership are for professionals, and are not intended for
anyone under 18.

**10. Changes to this policy**
We will post any changes on this page and update the effective date above.

**11. Contact us**
[Legal entity name], [registered office address]. Email: [rights address].
