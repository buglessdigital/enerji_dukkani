'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/common/WhatsAppButton'
import { Target, Lightbulb, Users, Award, Shield } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { StaticPage, PageValue, PageStat } from '@/lib/types'

// Icon mapping for values from Supabase
const iconMap: Record<string, React.ComponentType<any>> = {
  shield: Shield,
  users: Users,
  lightbulb: Lightbulb,
  target: Target,
  award: Award,
}

function getIcon(iconName: string): React.ComponentType<any> {
  return iconMap[iconName?.toLowerCase()] || Shield
}

export default function AboutPage() {
  const [page, setPage] = useState<StaticPage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPage() {
      const { data, error } = await supabase
        .from('static_pages')
        .select('*')
        .eq('slug', 'hakkimizda')
        .single()
      if (error) {
        console.error("Supabase Fetch Error:", error)
      }
      
      if (!error && data) {
        // Parse JSONB fields
        const parsed: StaticPage = {
          ...data,
          values: data.values_data || null,
          stats: data.stats_data || null,
        }
        setPage(parsed)
      } else {
        console.warn("No data returned or error occurred.", { error, data })
      }
      setLoading(false)
    }
    fetchPage()
  }, [])

  // Fallback values
  const title = page?.title || 'Hakkımızda'
  const content = page?.content || '<p>İçerik yükleniyor...</p>'
  const vision = page?.vision || ''
  const mission = page?.mission || ''
  const stats: PageStat[] = page?.stats || []
  const values: PageValue[] = page?.values || []

  return (
    <>
      <Navbar />

      <main className="pt-[104px] lg:pt-[140px] bg-neutral-50 pb-20">
        {/* Slim Hero */}
        <div className="relative h-48 sm:h-64 lg:h-80 bg-neutral-900 overflow-hidden">
          {page?.featured_image ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${page.featured_image})` }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-primary-900 to-neutral-900" />
          )}
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-10" />

          <div className="relative h-full flex flex-col items-center justify-center text-center container-custom drop-shadow-lg">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-white drop-shadow-md mb-4 animate-slide-up">
              {title}
            </h1>
            <div className="flex items-center gap-2 text-sm text-white/90 animate-fade-in font-medium">
              <a href="/" className="text-white hover:text-white/80 transition-colors">Ana Sayfa</a>
              <span className="text-white/70">/</span>
              <span className="text-white font-bold">Hakkımızda</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="container-custom mt-12 sm:mt-16 lg:mt-24">
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
              <div className="lg:w-1/2 space-y-6">
                <div className="h-6 w-24 skeleton rounded-full" />
                <div className="h-8 w-full skeleton rounded-lg" />
                <div className="h-4 w-full skeleton rounded" />
                <div className="h-4 w-3/4 skeleton rounded" />
                <div className="h-4 w-5/6 skeleton rounded" />
              </div>
              <div className="lg:w-1/2 space-y-6">
                <div className="h-48 w-full skeleton rounded-2xl" />
                <div className="h-48 w-full skeleton rounded-2xl" />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Content Section */}
            <div className="container-custom mt-12 sm:mt-16 lg:mt-24">
              <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">

                {/* Left: Text Content */}
                <div className="lg:w-1/2 space-y-6">
                  <div className="inline-block px-3 py-1 bg-primary-100 text-primary-700 font-semibold text-xs rounded-full mb-2 uppercase">
                    {page?.title || 'Hakkımızda'}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-heading font-bold text-neutral-900 leading-snug">
                    {page?.title ? `${page.title}` : 'Geleceğin Enerjisini Bugünden İnşa Ediyoruz'}
                  </h2>
                  <div
                    className="prose prose-neutral max-w-none text-neutral-600 leading-relaxed space-y-4"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </div>

                {/* Right: Vision & Mission */}
                <div className="lg:w-1/2 w-full space-y-6">
                  {vision && (
                    <div className="bg-white p-8 rounded-2xl shadow-card hover:shadow-card-hover transition-shadow relative overflow-hidden group">
                      <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out" />
                      <Target className="w-10 h-10 text-primary-500 mb-5 relative z-10" />
                      <h3 className="text-xl font-heading font-bold text-neutral-900 mb-3 relative z-10">Vizyonumuz</h3>
                      <p className="text-neutral-600 leading-relaxed relative z-10">{vision}</p>
                    </div>
                  )}

                  {mission && (
                    <div className="bg-white p-8 rounded-2xl shadow-card hover:shadow-card-hover transition-shadow relative overflow-hidden group">
                      <div className="absolute -right-8 -top-8 w-32 h-32 bg-accent-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out" />
                      <Award className="w-10 h-10 text-accent-500 mb-5 relative z-10" />
                      <h3 className="text-xl font-heading font-bold text-neutral-900 mb-3 relative z-10">Misyonumuz</h3>
                      <p className="text-neutral-600 leading-relaxed relative z-10">{mission}</p>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Stats Section */}
            {stats.length > 0 && (
              <div className="container-custom mt-20 lg:mt-32">
                <div className="bg-gradient-to-br from-primary-900 to-neutral-900 rounded-3xl p-8 sm:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/10">
                    {stats.map((stat, i) => (
                      <div key={i} className="text-center group">
                        <div className="text-4xl sm:text-5xl font-heading font-extrabold text-white mb-2 group-hover:scale-110 transition-transform duration-300">
                          {stat.value}
                        </div>
                        <div className="text-sm font-medium text-neutral-300 tracking-wider uppercase">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Core Values */}
            {values.length > 0 && (
              <div className="container-custom mt-20 lg:mt-32">
                <div className="text-center max-w-2xl mx-auto mb-16">
                  <h2 className="text-2xl sm:text-3xl font-heading font-bold text-neutral-900 mb-4">Core Değerlerimiz</h2>
                  <p className="text-neutral-500">Müşterilerimize en iyi deneyimi sunmak için bu değerler etrafında çalışıyoruz.</p>
                </div>

                <div className="grid sm:grid-cols-3 gap-8">
                  {values.map((v, i) => {
                    const IconComponent = getIcon(v.icon)
                    return (
                      <div key={i} className="bg-white p-8 rounded-2xl border border-neutral-100 hover:border-primary-100 shadow-sm hover:shadow-xl transition-all duration-300 text-center flex flex-col items-center">
                        <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mb-6">
                          <IconComponent className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-neutral-900 mb-3">{v.title}</h3>
                        <p className="text-neutral-600 text-sm leading-relaxed">{v.description}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}

      </main>

      <Footer />
      <WhatsAppButton />
    </>
  )
}
