import { ComingSoon } from '@/components/home/ComingSoon'
import { Community } from '@/components/home/Community'
import { Hero } from '@/components/home/Hero'
import { Main } from '@/components/layout/Main'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { getHome } from '@/lib/content'

export const metadata = {
  alternates: { canonical: '/' },
}

export default async function HomePage() {
  const home = await getHome()
  return (
    <>
      <SiteHeader tone="light" pathname="/" intro />
      <Main pageType="home">
        <Hero home={home} />
        <ComingSoon home={home} />
        <Community home={home} />
      </Main>
    </>
  )
}
