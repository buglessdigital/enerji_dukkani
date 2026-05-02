import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import HeroSlider from '@/components/home/HeroSlider'
import CollectionCards from '@/components/home/CollectionCards'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import WhatsAppButton from '@/components/common/WhatsAppButton'
import {
  getActiveHeroSlides,
  getActiveCollections,
  getFeaturedProducts,
  getSiteSettings,
} from '@/lib/supabase'

export default async function HomePage() {
  const [slides, collections, products, settings] = await Promise.all([
    getActiveHeroSlides(),
    getActiveCollections(),
    getFeaturedProducts(),
    getSiteSettings(),
  ])

  return (
    <>
      <Navbar />

      <main className="pt-[104px] lg:pt-[140px]">
        <HeroSlider initialSlides={slides} initialSettings={settings} />
        <CollectionCards initialCollections={collections} />
        <FeaturedProducts initialProducts={products} />
      </main>

      <Footer />
      <WhatsAppButton />
    </>
  )
}
