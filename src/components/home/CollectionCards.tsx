'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Collection } from '@/lib/types'

export default function CollectionCards() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCollections() {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      if (!error && data) {
        setCollections(data)
      }
      setLoading(false)
    }
    fetchCollections()
  }, [])

  // Gradient colors for cards without images
  const gradients = [
    'from-blue-600 to-blue-800',
    'from-emerald-600 to-emerald-800',
    'from-amber-600 to-amber-800',
    'from-violet-600 to-violet-800',
    'from-rose-600 to-rose-800',
    'from-cyan-600 to-cyan-800',
  ]

  if (loading) {
    return (
      <section className="section bg-white" id="collections">
        <div className="container-custom">
          <div className="text-center mb-10">
            <h2 className="section-title">Öne Çıkan Koleksiyonlar</h2>
            <p className="section-subtitle">İhtiyacınıza uygun enerji çözümlerini keşfedin</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-64 sm:h-72 rounded-2xl skeleton" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (collections.length === 0) {
    return (
      <section className="section bg-white" id="collections">
        <div className="container-custom">
          <div className="text-center mb-10">
            <h2 className="section-title">Öne Çıkan Koleksiyonlar</h2>
            <p className="section-subtitle">Koleksiyon bulunamadı. Lütfen yönetim panelinden ekleyin.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-64 sm:h-72 rounded-2xl bg-neutral-100 border border-neutral-200 border-dashed flex items-center justify-center text-neutral-400">Boş Alan</div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="section bg-white" id="collections">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="section-title">Öne Çıkan Koleksiyonlar</h2>
          <p className="section-subtitle">
            İhtiyacınıza uygun enerji çözümlerini keşfedin
          </p>
        </div>

        {/* Collection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {collections.map((collection, index) => (
            <Link
              key={collection.id}
              href={collection.target_url}
              className="group relative h-64 sm:h-72 rounded-2xl overflow-hidden cursor-pointer"
              id={`collection-${collection.id}`}
            >
              {/* Background */}
              {collection.image_url ? (
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundImage: `url(${collection.image_url})` }}
                />
              ) : (
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${gradients[index % gradients.length]} transition-transform duration-500 group-hover:scale-110`}
                />
              )}

              {/* Dark overlay for readability */}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />

              {/* Decorative pattern */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />

              {/* Default content */}
              <div className="absolute inset-x-0 top-0 flex flex-col items-center justify-start text-white p-6 pt-8 text-center transition-all duration-400 group-hover:opacity-0 group-hover:-translate-y-4">
                <h3 className="font-heading text-xl font-bold mb-1">{collection.title}</h3>
                {collection.subtitle && (
                  <p className="text-sm text-white/70">{collection.subtitle}</p>
                )}
              </div>

              {/* Hover content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center opacity-0 translate-y-4 transition-all duration-400 group-hover:opacity-100 group-hover:translate-y-0">
                {collection.hover_text && (
                  <p className="text-sm leading-relaxed text-white/90 mb-4">
                    {collection.hover_text}
                  </p>
                )}
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                  Keşfet
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>

              {/* Bottom gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
