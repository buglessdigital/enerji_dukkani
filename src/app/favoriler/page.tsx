'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Bookmark, ShoppingCart, Trash2, ArrowRight, ImageIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/context/CartContext'
import { useFavorites } from '@/context/FavoritesContext'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/common/WhatsAppButton'

function formatPrice(p: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(p)
}

export default function FavoritesPage() {
  const { addToCart } = useCart()
  const { favoriteIds, toggleFavorite } = useFavorites()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFavoriteProducts() {
      if (!favoriteIds || favoriteIds.length === 0) {
        setProducts([])
        setLoading(false)
        return
      }

      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, name, slug, brand, price, sale_price, stock_quantity,
          images:product_images(url, is_cover)
        `)
        .in('id', favoriteIds)
        .eq('is_active', true)

      if (data) {
        setProducts(data)
        // localStorage'da var ama DB'de olmayan stale ID'leri temizle
        const validIds = new Set(data.map((p: any) => p.id))
        favoriteIds.forEach(id => {
          if (!validIds.has(id)) toggleFavorite(id)
        })
      }
      setLoading(false)
    }

    fetchFavoriteProducts()
  }, [favoriteIds])

  const removeFavorite = (id: string) => {
    toggleFavorite(id)
    setProducts(products.filter(p => p.id !== id))
  }

  return (
    <>
      <Navbar />
      
      <main className="pt-[104px] lg:pt-[140px] bg-neutral-50 min-h-screen pb-20">
        <div className="container-custom py-8">
          
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center">
              <Bookmark className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 font-heading">Favorilerim</h1>
              <p className="text-sm text-neutral-500">Beğendiğiniz ve daha sonra incelemek üzere kaydettiğiniz ürünler.</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4">
                   <div className="w-full aspect-square skeleton rounded-xl mb-4" />
                   <div className="h-4 skeleton w-3/4 mb-2" />
                   <div className="h-4 skeleton w-1/2 mb-4" />
                   <div className="h-10 skeleton w-full rounded-xl" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-12 text-center max-w-2xl mx-auto">
              <div className="w-24 h-24 bg-neutral-100 text-neutral-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Bookmark className="w-12 h-12" />
              </div>
              <h2 className="text-xl font-bold text-neutral-900 mb-2">Favori Listeniz Boş</h2>
              <p className="text-neutral-500 mb-8 max-w-md mx-auto">
                Şu anda favori listenizde hiç ürün bulunmuyor. İlginizi çeken ürünleri kalp ikonuna tıklayarak buraya ekleyebilirsiniz.
              </p>
              <Link href="/" className="btn btn-primary inline-flex">
                Alışverişe Başla <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map(product => {
                const cover = product.images?.find((i: any) => i.is_cover) || product.images?.[0]
                const finalPrice = product.sale_price || product.price
                const hasDiscount = !!product.sale_price

                return (
                  <div key={product.id} className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden group hover:border-primary-200 transition-colors flex flex-col">
                     {/* Image */}
                     <Link href={`/urun/${product.slug}`} className="relative aspect-square bg-neutral-100 p-4 block cursor-pointer">
                        {cover?.url ? (
                            <Image 
                              src={cover.url} 
                              alt={product.name} 
                              fill 
                              className="object-contain p-4 group-hover:scale-105 transition-transform duration-500" 
                              sizes="(max-width: 768px) 100vw, 25vw"
                            />
                        ) : (
                          <div className="flex items-center justify-center h-full text-4xl opacity-20 pointer-events-none"><ImageIcon className="w-12 h-12 text-neutral-400" /></div>
                        )}                        {product.stock_quantity <= 0 && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20 z-10 flex items-center justify-center">
                            <span className="text-white font-bold text-lg tracking-[0.2em] uppercase drop-shadow-lg">TÜKENDİ</span>
                          </div>
                        )}
                        
                        {/* Remove Action */}
                        <button 
                          onClick={(e) => {
                            e.preventDefault()
                            removeFavorite(product.id)
                          }}
                          className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm shadow-sm rounded-full flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-white transition-colors"
                          title="Favorilerden Çıkar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                     </Link>

                     {/* Info */}
                     <div className="p-5 flex flex-col flex-1">
                        {product.brand && (
                          <span className="text-xs font-bold text-primary-600 uppercase tracking-wide mb-1">{product.brand}</span>
                        )}
                        <Link href={`/urun/${product.slug}`} className="font-bold text-neutral-900 line-clamp-2 hover:text-primary-600 transition-colors mb-3">
                          {product.name}
                        </Link>
                        
                        <div className="mt-auto pt-2 flex items-end justify-between">
                          <div>
                            <span className="text-lg font-heading font-extrabold text-neutral-900 block leading-none">
                              {formatPrice(finalPrice)}
                            </span>
                            {hasDiscount && (
                              <span className="text-xs font-medium text-neutral-400 line-through mt-1 block">
                                {formatPrice(product.price)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-4 pt-4 border-t border-neutral-100 flex gap-2">
                          <Link href={`/urun/${product.slug}`} className="btn bg-neutral-100 text-neutral-700 hover:bg-neutral-200 flex-1 py-2 text-sm justify-center">
                            İncele
                          </Link>
                          <button 
                            onClick={() => {
                              addToCart(product, 1)
                              alert('Ürün sepete eklendi!')
                            }}
                            disabled={product.stock_quantity === 0}
                            className="bg-primary-600 text-white p-2 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:bg-neutral-300 disabled:cursor-not-allowed"
                            title={product.stock_quantity === 0 ? 'Stokta Yok' : 'Sepete Ekle'}
                          >
                            <ShoppingCart className="w-5 h-5" />
                          </button>
                        </div>
                     </div>
                  </div>
                )
              })}
            </div>
          )}

        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </>
  )
}
