import { ComingSoon } from '@/components/home/ComingSoon'
import { Community } from '@/components/home/Community'
import { Hero } from '@/components/home/Hero'
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
      <main id="main">
        <Hero home={home} />
        <ComingSoon home={home} />
        <Community home={home} />
      </main>
    </>
  )
}
