import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import HeroSlider from '@/components/home/HeroSlider'
import CollectionCards from '@/components/home/CollectionCards'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import WhatsAppButton from '@/components/common/WhatsAppButton'

export default function HomePage() {
  return (
    <>
      <Navbar />
      
      {/* Main content - offset for fixed navbar */}
      <main className="pt-[104px] lg:pt-[140px]">
        <HeroSlider />
        <CollectionCards />
        <FeaturedProducts />
      </main>

      <Footer />
      <WhatsAppButton />
    </>
  )
}
