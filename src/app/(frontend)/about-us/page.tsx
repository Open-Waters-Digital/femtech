import type { Metadata } from 'next'

import {
  AboutHero,
  Founder,
  Join,
  Mission,
  Values,
  WhatWeDo,
  WhyWeExist,
} from '@/components/about/AboutSections'
import { Main } from '@/components/layout/Main'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { getAbout } from '@/lib/content'

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'FemTech Healthcare Network is a global community for women shaping the future of healthcare technology. Our mission, what we do, what we stand for, and our founder.',
  alternates: { canonical: '/about-us' },
}

export default async function AboutPage() {
  const about = await getAbout()
  return (
    <>
      <SiteHeader tone="light" pathname="/about-us" />
      <Main pageType="about">
        <AboutHero about={about} />
        <Mission about={about} />
        <WhyWeExist about={about} />
        <WhatWeDo about={about} />
        <Values about={about} />
        <Founder about={about} />
        <Join about={about} />
      </Main>
    </>
  )
}
