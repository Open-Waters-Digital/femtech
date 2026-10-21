/**
 * Seeds an empty database with the site's content: an admin, the images and
 * hero video, and the copy for the three globals.
 *
 *   pnpm run seed
 *
 * Run against production once, from a machine, with the production
 * DATABASE_URL (the public proxy URL) and the S3 variables set, so the uploads
 * land in the bucket. Never part of a deploy.
 *
 * Idempotent per step, not as a whole, so a run that dies halfway recovers:
 *
 *   - the admin is created only if no user exists
 *   - each upload is keyed on its filename and reused if present
 *   - each global is written only while it is still empty, so a re-run never
 *     overwrites an editor's changes. SEED_OVERWRITE=1 forces it.
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import config from '@payload-config'
import { type Payload, getPayload } from 'payload'

const ASSETS = path.join(path.dirname(fileURLToPath(import.meta.url)), 'seed-assets')
const OVERWRITE = process.env.SEED_OVERWRITE === '1'

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
}

async function upload(
  payload: Payload,
  collection: 'media' | 'videos',
  filename: string,
  data: { alt: string } | { description: string },
): Promise<number> {
  const existing = await payload.find({
    collection,
    where: { filename: { equals: filename } },
    limit: 1,
    depth: 0,
  })
  const found = existing.docs[0]
  if (found) return found.id

  const buffer = await readFile(path.join(ASSETS, filename))
  const created = await payload.create({
    collection,
    // The two collections take different fields; each call passes its own.
    data: data as never,
    file: {
      data: buffer,
      mimetype: MIME[path.extname(filename)] ?? 'application/octet-stream',
      name: filename,
      size: buffer.byteLength,
    },
  })
  console.log(`  uploaded ${collection}/${filename}`)
  return created.id
}

/** A global counts as empty until its first required field has a value. */
async function isEmpty(
  payload: Payload,
  slug: 'home' | 'about' | 'site-settings',
  field: string,
): Promise<boolean> {
  const global = (await payload.findGlobal({ slug, depth: 0 })) as unknown as Record<
    string,
    unknown
  >
  return !global[field]
}

async function seedAdmin(payload: Payload): Promise<void> {
  const users = await payload.count({ collection: 'users' })
  if (users.totalDocs > 0) return console.log('admin: exists, skipped')

  const email = process.env.SEED_ADMIN_EMAIL
  const password = process.env.SEED_ADMIN_PASSWORD
  if (!email || !password) {
    throw new Error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to create the first admin.')
  }
  await payload.create({ collection: 'users', data: { email, password, name: 'Admin' } })
  console.log(`admin: created ${email}`)
}

async function seedSiteSettings(payload: Payload): Promise<void> {
  if (!OVERWRITE && !(await isEmpty(payload, 'site-settings', 'footerHeading'))) {
    return console.log('site settings: has content, skipped')
  }
  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      footerHeading:
        'We welcome you to register your interest and join a community shaping the future of women in healthcare technology.',
      footerCtaLabel: 'Sign Up',
      copyrightHolder: 'Femtech',
      ...SIGNUP_COPY,
    },
  })
  console.log('site settings: written')
}

/**
 * The sign-up page's copy, supplied by the client on 20 October 2026. Verbatim.
 *
 * Its own step, keyed on the eyebrow, so a database seeded before the page was
 * rewritten gets the new copy without SEED_OVERWRITE (which would also replace
 * the home and about pages). Once the eyebrow has a value it is never touched.
 */
const SIGNUP_COPY = {
  signupEyebrow: 'Sign Up',
  signupTitle: 'Become a Member. It’s free.',
  signupLead:
    'Join FemTech Healthcare Network and be part of a global community of women shaping the future of healthcare technology.',
  signupBenefitsHeading: 'What membership means',
  signupBenefitsIntro:
    'Membership is free and gives you first access to everything we’re building:',
  signupBenefits: [
    {
      title: 'Curated events',
      description: 'intimate gatherings designed for meaningful connections, not crowded rooms',
    },
    {
      title: 'Speakeasies',
      description:
        'relaxed, invitation-style evenings to meet peers, share ideas and build your network',
    },
    {
      title: 'Keynotes',
      description: 'insight and inspiration from leaders transforming healthcare and technology',
    },
    {
      title: 'Investment pitches',
      description:
        'spaces where women founders and innovators can meet investors and pitch for the backing to scale',
    },
    {
      title: 'Member spaces',
      description: 'new platforms to connect, collaborate and grow, launching soon',
    },
  ],
  signupComingSoonHeading: 'Coming soon',
  signupComingSoonBody:
    'Our full events schedule launches on our Events page in December 2026, along with new products and member offerings. Sign up now and you’ll be the first to hear when it goes live.',
  signupFormHeading: 'Join the Network',
  signupThanksHeading: 'Welcome to FemTech Healthcare Network.',
  signupThanks:
    'You’re officially a member. Keep an eye on your inbox: our events schedule, investment pitch opportunities and new member offerings launch in December 2026, and you’ll be the first to know.',
}

async function seedSignupCopy(payload: Payload): Promise<void> {
  if (!OVERWRITE && !(await isEmpty(payload, 'site-settings', 'signupEyebrow'))) {
    return console.log('sign-up copy: has content, skipped')
  }
  await payload.updateGlobal({ slug: 'site-settings', data: SIGNUP_COPY })
  console.log('sign-up copy: written')
}

async function seedHome(payload: Payload): Promise<void> {
  if (!OVERWRITE && !(await isEmpty(payload, 'home', 'heroTitle'))) {
    return console.log('home: has content, skipped')
  }

  const poster = await upload(payload, 'media', 'hero-poster.jpg', {
    alt: 'Five women in business dress talking as they walk together outside an office building.',
  })
  const mp4 = await upload(payload, 'videos', 'hero.mp4', {
    description: 'Hero loop: women in healthcare and technology at work.',
  })
  const webm = await upload(payload, 'videos', 'hero.webm', {
    description: 'Hero loop, WebM.',
  })
  const photos = [
    await upload(payload, 'media', 'coming-soon-1.jpg', {
      alt: 'Five professional women standing together on a staircase, the eldest in front.',
    }),
    await upload(payload, 'media', 'coming-soon-2.jpg', {
      alt: 'A smiling woman shaking hands across a table with a colleague.',
    }),
    await upload(payload, 'media', 'coming-soon-3.jpg', {
      alt: 'Women seated in rows at a conference, listening and taking notes.',
    }),
  ]
  const insights = await upload(payload, 'media', 'community-insights.jpg', {
    alt: 'Two colleagues smiling as they look at a laptop together in an office.',
  })
  const news = await upload(payload, 'media', 'community-news.jpg', {
    alt: 'A woman seen from behind addressing a small group, who are applauding.',
  })

  await payload.updateGlobal({
    slug: 'home',
    data: {
      heroTitle: 'femtech',
      heroLeadStrong:
        'Femtech is a community-driven platform dedicated to supporting women working in healthcare technology.',
      heroLead:
        'It brings together innovators, clinicians, founders, researchers and technologists who are pushing the boundaries of digital health.',
      heroPoster: poster,
      heroVideoMp4: mp4,
      heroVideoWebm: webm,
      discoverLabel: 'Discover',
      comingSoonEyebrow: 'Coming soon',
      comingSoonStatement:
        'We will soon offer shared knowledge, practical resources, expert insights and a collaborative space where women can connect, learn and advance their careers. Its goal is to amplify women’s voices, accelerate their impact and build a more inclusive, future-ready healthtech landscape.',
      comingSoonPhotos: photos,
      communityEyebrow: 'Made by women, for women',
      communityStatement:
        'Women supporting women across every stage of their careers, working together to lift the next generation and strengthen the future of healthcare technology.',
      communityCards: [
        {
          title: 'Insights and Advice',
          body: 'Practical, timely insights designed to support women navigating healthcare technology. The site shares clear guidance, expert perspectives, and real-world advice to help members grow, innovate, and confidently advance their careers.',
          image: insights,
        },
        {
          title: 'Find Latest News',
          body: 'Stay up to date with the latest in healthcare tech. Explore fresh news, breakthroughs, and emerging trends to stay informed, inspired, and ahead of a rapidly evolving industry.',
          image: news,
        },
      ],
    },
  })
  console.log('home: written')
}

async function seedAbout(payload: Payload): Promise<void> {
  if (!OVERWRITE && !(await isEmpty(payload, 'about', 'heroTitle'))) {
    return console.log('about: has content, skipped')
  }

  const portrait = await upload(payload, 'media', 'tanya-singh-nasdaq.webp', {
    alt: 'Tanya AH Singh, Co-Founder of FemTech Healthcare Network, on the Nasdaq billboard in Times Square, New York, for the Stand Out 50.',
  })

  await payload.updateGlobal({
    slug: 'about',
    data: {
      heroEyebrow: 'About Us',
      heroTitle: 'Where healthcare and technology meet, people make the difference.',
      heroLead:
        'FemTech Healthcare Network is a global community for women shaping the future of healthcare technology. We bring together clinicians, founders, executives, innovators, investors and rising talent to share knowledge, open doors and accelerate what’s possible when diverse leaders build healthcare together.',
      missionLabel: 'Our Mission',
      mission:
        'To empower women across healthcare and technology to lead, innovate and grow, by creating a connected community built on knowledge sharing, visibility, investment and opportunity.',
      whyLabel: 'Why We Exist',
      whyStatement: 'Technology alone doesn’t transform healthcare. People do.',
      whyBody: [
        'Healthcare technology is moving faster than ever, from AI and diagnostics to digital care and data. Yet women remain under-represented in the rooms where decisions are made, products are built and capital is allocated. Female founders still receive a fraction of healthcare investment, and too many great ideas never reach the people who could fund them. That gap shapes how care is designed and who it serves.',
        'We exist to close it. When more women lead, build and secure investment in healthcare technology, innovation becomes more inclusive, more relevant and more impactful for everyone.',
      ].join('\n\n'),
      doLabel: 'What We Do',
      doRows: [
        {
          title: 'Connect',
          body: 'A global network linking women across clinical, commercial, technical and leadership roles.',
        },
        {
          title: 'Unlock investment',
          body: 'Opening up spaces where women founders and innovators can meet investors, pitch their ideas and access the funding and backing to scale.',
        },
        {
          title: 'Share knowledge',
          body: 'Insights and expertise from leaders who have built, scaled and transformed healthcare organisations.',
        },
        {
          title: 'Raise visibility',
          body: 'Platforms that showcase women driving change in health and technology.',
        },
        {
          title: 'Open doors',
          body: 'Introductions, mentoring and partnerships that create real opportunity.',
        },
        {
          title: 'Champion inclusion',
          body: 'Advocating for diverse leadership and equitable access to healthcare innovation.',
        },
      ],
      valuesLabel: 'What We Stand For',
      values: [
        { title: 'Community over competition', body: 'We rise by lifting others.' },
        { title: 'Knowledge with purpose', body: 'Learning that translates into action.' },
        {
          title: 'Access for all',
          body: 'Opportunity and investment shouldn’t depend on who you know.',
        },
        { title: 'Inclusion by design', body: 'Diverse voices make better healthcare.' },
        {
          title: 'Courage to lead',
          body: 'Backing women to step forward and shape the agenda.',
        },
      ],
      founderEyebrow: 'Meet Our Founder',
      founderName: 'Tanya AH Singh',
      founderRole: 'Co-Founder & Chief Executive Officer',
      founderImage: portrait,
      founderBio: [
        'Tanya is a healthcare executive, commercial strategist and transformation leader. Her career spans healthcare technology, medical imaging, diagnostics and digital health, and she has built it at the intersection of commercial strategy, business growth and executive leadership. Across complex and fast-changing healthcare environments, she turns ambitious ideas into practical, measurable outcomes.',
        'As former Chief Commercial Officer of a global healthcare technology company specialising in PACS and RIS, Tanya led global commercial strategy, strategic partnerships and international market expansion. She drove growth and the adoption of innovative imaging technologies across international markets. Her wider executive experience covers commercial development, operations, customer experience, organisational change and people leadership.',
        'Today, Tanya advises startups, scale-ups, healthcare providers, NHS organisations and leadership teams on commercial growth, strategy, transformation and market expansion. She also sits on the Advisory Board of Revive ME, helping shape the strategic direction of its healthcare and longevity conference and exhibition in Abu Dhabi.',
      ].join('\n\n'),
      founderSections: [
        {
          heading: 'Recognised globally',
          body: 'Tanya has been named in the Future of Field Service Stand Out 50 for the second consecutive year, in 2025 and 2026. She is one of 50 leaders recognised worldwide, across industries, for authenticity, innovation and execution in service leadership. Her 2026 recognition was showcased on the Nasdaq billboard in Times Square, New York.',
        },
        {
          heading: 'Her leadership philosophy',
          body: 'Tanya leads by three principles: build trust, empower people and execute with discipline. She believes sustainable growth takes more than a strong strategy or new technology. It takes the ability to align people behind a shared direction and turn ideas into action. She is particularly focused on the forces reshaping healthcare, from AI and emerging technologies to workforce transformation and the challenge of achieving meaningful adoption at scale.',
        },
        {
          heading: 'Leading FemTech Healthcare Network forward',
          body: 'Having co-founded FemTech Healthcare Network to champion leadership, innovation and collaboration across women’s health, healthcare and technology, Tanya now steps into the role of Chief Executive Officer. She will lead the network into its next chapter, expanding its global reach, building strategic partnerships and creating new platforms for women in healthcare technology to connect, grow and lead. Her ambition is clear: to make FemTech Healthcare Network the leading global community for women shaping the future of healthcare.',
        },
      ],
      // Not known yet. The "Connect on LinkedIn" button appears once it is set.
      founderLinkedIn: null,
      joinTitle: 'Join the Network',
      joinBody:
        'Whether you’re building, investing, leading or just starting out in healthcare technology, there’s a place for you here.',
      joinCtaLabel: 'Sign Up',
    },
  })
  console.log('about: written')
}

/**
 * Tanya's speaking engagements as supplied on 20 October 2026. Each is written
 * once, keyed on its slug, and never overwritten: an editor's correction (a
 * confirmed topic, a venue) must survive a re-seed.
 *
 * Revive ME's dates and venue come from secondary listings and its organiser
 * URL was not supplied, so it is listed without a link. Service Next Medical's
 * keynote topic is to be confirmed by its organisers.
 */
const SPEAKING_ENGAGEMENTS = [
  {
    title: 'Field Service Europe 2026',
    slug: 'field-service-europe-2026',
    startsAt: '2026-10-26T10:40:00.000Z',
    startsAt_tz: 'Europe/Amsterdam',
    allDay: false,
    city: 'Amsterdam',
    country: 'Netherlands',
    speakers: [{ name: 'Tanya AH Singh', role: 'panel' }],
    sessionTitle:
      'Panel: Evolving the Service Value Proposition to Turn Capability into Scalable Growth',
    organiserUrl: 'https://fieldserviceeu.wbresearch.com/speakers/tanya-singh',
  },
  {
    title: 'Revive ME Global Longevity & Health Tech Summit',
    slug: 'revive-me-2026',
    // 09:00 and 18:00 in Abu Dhabi; shown as dates only.
    startsAt: '2026-11-11T05:00:00.000Z',
    startsAt_tz: 'Asia/Dubai',
    endsAt: '2026-11-12T14:00:00.000Z',
    endsAt_tz: 'Asia/Dubai',
    allDay: true,
    venue: 'ADNEC',
    city: 'Abu Dhabi',
    country: 'United Arab Emirates',
    speakers: [{ name: 'Tanya AH Singh', role: 'tbc' }],
    summary: 'UAE’s Premier Longevity And Health Tech Exhibition & Conference',
  },
  {
    title: 'Service Next Medical 2027',
    slug: 'service-next-medical-2027',
    // 09:00 on 1 March to 17:00 on 3 March in Carlsbad; shown as dates only.
    startsAt: '2027-03-01T17:00:00.000Z',
    startsAt_tz: 'America/Los_Angeles',
    endsAt: '2027-03-04T01:00:00.000Z',
    endsAt_tz: 'America/Los_Angeles',
    allDay: true,
    venue: 'Westin Carlsbad Resort & Spa',
    city: 'Carlsbad, California',
    country: 'United States',
    speakers: [{ name: 'Tanya AH Singh', role: 'keynote' }],
    organiserUrl: 'https://servicenextmedical.wbresearch.com',
  },
] as const

async function seedEvents(payload: Payload): Promise<void> {
  for (const event of SPEAKING_ENGAGEMENTS) {
    const existing = await payload.count({
      collection: 'events',
      where: { slug: { equals: event.slug } },
    })
    if (existing.totalDocs > 0) {
      console.log(`events: ${event.slug} exists, skipped`)
      continue
    }
    await payload.create({
      collection: 'events',
      data: {
        ...event,
        speakers: event.speakers.map((speaker) => ({ ...speaker })),
        kind: 'speaking',
        status: 'published',
      },
    })
    console.log(`events: ${event.slug} written`)
  }
}

const payload = await getPayload({ config })
await seedAdmin(payload)
await seedSiteSettings(payload)
await seedSignupCopy(payload)
await seedHome(payload)
await seedAbout(payload)
await seedEvents(payload)
console.log('seed: done')
process.exit(0)
