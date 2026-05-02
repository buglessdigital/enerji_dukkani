'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Phone } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { HeroSlide, SiteSettings } from '@/lib/types'

interface HeroSliderProps {
  initialSlides?: HeroSlide[]
  initialSettings?: SiteSettings | null
}

export default function HeroSlider({ initialSlides = [], initialSettings = null }: HeroSliderProps) {
  const [slides, setSlides] = useState<HeroSlide[]>(initialSlides)
  const [settings, setSettings] = useState<SiteSettings | null>(initialSettings)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [loading, setLoading] = useState(initialSlides.length === 0)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  // Only fetch if no initial data was provided
  useEffect(() => {
    if (initialSlides.length > 0) return
    async function fetchData() {
      const [slidesRes, settingsRes] = await Promise.all([
        supabase.from('hero_slides').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
        supabase.from('site_settings').select('hero_fallback_badge,hero_fallback_title,hero_fallback_description').limit(1).single(),
      ])
      if (!slidesRes.error && slidesRes.data && slidesRes.data.length > 0) {
        setSlides(slidesRes.data)
      }
      if (!settingsRes.error && settingsRes.data) {
        setSettings(settingsRes.data as any)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const goToSlide = useCallback(
    (index: number) => {
      if (isTransitioning || slides.length === 0) return
      setIsTransitioning(true)
      setCurrentSlide(index)
      setTimeout(() => setIsTransitioning(false), 600)
    },
    [isTransitioning, slides.length]
  )

  const nextSlide = useCallback(() => {
    if (slides.length === 0) return
    goToSlide((currentSlide + 1) % slides.length)
  }, [currentSlide, goToSlide, slides.length])

  const prevSlide = useCallback(() => {
    if (slides.length === 0) return
    goToSlide((currentSlide - 1 + slides.length) % slides.length)
  }, [currentSlide, goToSlide, slides.length])

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return
    const diff = touchStartX - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      diff > 0 ? nextSlide() : prevSlide()
    }
    setTouchStartX(null)
  }

  // Auto-play
  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(nextSlide, 6000)
    return () => clearInterval(timer)
  }, [nextSlide, slides.length])

  // Loading skeleton
  if (loading) {
    return (
      <section className="relative w-full h-[480px] sm:h-[540px] lg:h-[600px] overflow-hidden bg-neutral-900">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-neutral-900" />
        <div className="relative h-full container-custom flex items-center">
          <div className="max-w-2xl space-y-5">
            <div className="w-40 h-8 skeleton rounded-full" />
            <div className="w-96 h-14 skeleton rounded-lg" />
            <div className="w-80 h-6 skeleton rounded-lg" />
            <div className="flex gap-3">
              <div className="w-40 h-12 skeleton rounded-lg" />
              <div className="w-36 h-12 skeleton rounded-lg" />
            </div>
          </div>
        </div>
      </section>
    )
  }

  // No slides in DB
  if (slides.length === 0) {
    return (
      <section className="relative w-full h-[480px] sm:h-[540px] lg:h-[600px] overflow-hidden bg-neutral-900" id="hero-slider">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-neutral-900" />
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.15) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        <div className="relative h-full container-custom flex items-center">
          <div className="max-w-2xl space-y-5">
            <div className="inline-flex items-center gap-2 bg-accent-500/20 border border-accent-500/30 text-accent-300 px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-accent-400 rounded-full animate-pulse" />
              {settings?.hero_fallback_badge || 'Enerji Çözümleri'}
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl xl:text-[3.5rem] font-extrabold text-white drop-shadow-lg leading-tight">
              {settings?.hero_fallback_title || 'Güneş Enerjisi ile Geleceği Aydınlatın'}
            </h1>
            <p className="text-base sm:text-lg text-white/95 drop-shadow-md leading-relaxed max-w-xl">
              {settings?.hero_fallback_description || 'Yüksek verimli güneş panelleri ve inverter sistemleri ile enerji maliyetlerinizi düşürün.'}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/kategori" className="btn btn-accent btn-lg group">
                Ürünleri İncele
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link href="/iletisim" className="btn btn-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm">
                <Phone className="w-4 h-4" />
                Bize Ulaşın
              </Link>
            </div>
          </div>
        </div>
      </section>
    )
  }

  const slide = slides[currentSlide]

  // Gradient colors for slides without images
  const gradients = [
    'bg-gradient-to-br from-primary-900 via-primary-800 to-neutral-900',
    'bg-gradient-to-br from-neutral-900 via-primary-900 to-accent-900',
    'bg-gradient-to-br from-neutral-800 via-neutral-900 to-primary-900',
  ]

  return (
    <section
      className="relative w-full h-[480px] sm:h-[540px] lg:h-[600px] overflow-hidden bg-neutral-900"
      id="hero-slider"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Images */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-all duration-700 ease-in-out ${
            i === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          }`}
        >
          {s.image_url ? (
            <>
              {/* Desktop image */}
              <div
                className="absolute inset-0 bg-cover bg-center hidden sm:block"
                style={{ backgroundImage: `url(${s.image_url})` }}
              />
              {/* Mobile image — fallback to desktop if no mobile_image_url */}
              <div
                className="absolute inset-0 bg-cover bg-center sm:hidden"
                style={{ backgroundImage: `url(${s.mobile_image_url || s.image_url})` }}
              />
            </>
          ) : (
            <div className={`absolute inset-0 ${gradients[i % gradients.length]}`} />
          )}
          {/* Pattern overlay for visual interest */}
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.15) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />
        </div>
      ))}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative h-full container-custom flex items-center">
        <div className="max-w-2xl space-y-5 animate-fade-in" key={currentSlide}>
          {/* Subtitle badge */}
          {slide.subtitle && (
            <div className="inline-flex items-center gap-2 bg-accent-500/20 border border-accent-500/30 text-accent-300 px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-accent-400 rounded-full animate-pulse" />
              {slide.subtitle}
            </div>
          )}

          {/* Title */}
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl xl:text-[3.5rem] font-extrabold text-white drop-shadow-lg leading-tight">
            {slide.title}
          </h1>

          {/* Description */}
          {slide.description && (
            <p className="text-base sm:text-lg text-white/95 drop-shadow-md leading-relaxed max-w-xl">
              {slide.description}
            </p>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {slide.button_text && (
              <Link
                href={slide.button_link || '#'}
                className="btn btn-accent btn-lg group"
              >
                {slide.button_text}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}
            {slide.secondary_button_text && (
              <Link
                href={slide.secondary_button_link || '#'}
                className="btn btn-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm"
              >
                <Phone className="w-4 h-4" />
                {slide.secondary_button_text}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/25 backdrop-blur-md rounded-full items-center justify-center text-white transition-all border border-white/10"
            aria-label="Önceki slayt"
            id="hero-prev"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/25 backdrop-blur-md rounded-full items-center justify-center text-white transition-all border border-white/10"
            aria-label="Sonraki slayt"
            id="hero-next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`transition-all duration-300 rounded-full ${
                i === currentSlide
                  ? 'w-8 h-2.5 bg-accent-500'
                  : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Slayt ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
