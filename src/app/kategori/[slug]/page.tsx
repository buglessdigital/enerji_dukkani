'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Filter, ChevronDown, Check, ShoppingCart, Heart, Eye, ArrowLeft, X, ImageIcon, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/context/CartContext'
import { useFavorites } from '@/context/FavoritesContext'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/common/WhatsAppButton'

export default function CategoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { addToCart } = useCart()
  const { isFavorite, toggleFavorite } = useFavorites()
  const [category, setCategory] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isNotFound, setIsNotFound] = useState(false)
  
  // Sorting and Filters
  const [sortOption, setSortOption] = useState<'newest'|'price_asc'|'price_desc'>('newest')

  useEffect(() => {
    async function fetchData() {
      // 1. Kategori bilgisini Slug'dan bul
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (catError || !catData) {
        setIsNotFound(true)
        setLoading(false)
        return
      }
      
      setCategory(catData)

      // 2. Alt kategorileri bul
      const { data: subCats } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', catData.id)

      let categoryIds = [catData.id]
      if (subCats && subCats.length > 0) {
        categoryIds = [...categoryIds, ...subCats.map(c => c.id)]
      }

      // 3. Kategoriye ve alt kategorilerine ait ürünleri çek
      const { data: prodData } = await supabase
        .from('products')
        .select(`
          *,
          images:product_images(id, url, alt_text, sort_order, is_cover)
        `)
        .in('category_id', categoryIds)
        .eq('is_active', true)

      if (prodData) {
        setProducts(prodData)
      }
      setLoading(false)
    }

    setLoading(true)
    fetchData()
  }, [slug])

  // İstemci tarafı Sıralama
  const sortedProducts = [...products].sort((a, b) => {
    const priceA = a.sale_price || a.price
    const priceB = b.sale_price || b.price
    
    if (sortOption === 'price_asc') return priceA - priceB
    if (sortOption === 'price_desc') return priceB - priceA
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  function formatPrice(price: number) {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(price)
  }

  if (isNotFound) {
    return (
      <>
        <Navbar />
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 pt-32">
           <h1 className="text-4xl font-bold font-heading mb-4 text-neutral-900">404</h1>
           <p className="text-neutral-500 mb-8">Aradığınız kategori bulunamadı veya yayından kaldırılmış olabilir.</p>
           <Link href="/kategori" className="btn btn-primary">Tüm Ürünlere Dön</Link>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      
      {/* Kategori Hero */}
      <div className="pt-[104px] lg:pt-[140px] bg-neutral-900 border-b border-neutral-800 relative overflow-hidden">
         {/* Background pattern */}
         <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-accent-500 via-transparent to-transparent" />
         
         <div className="container-custom py-12 lg:py-16 relative z-10 text-center">
            
            <Link href="/kategori" className="inline-flex items-center gap-1 text-sm font-medium text-neutral-400 hover:text-white transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" /> Kategorilere Dön
            </Link>

            {loading ? (
              <div className="h-10 w-48 bg-white/10 rounded animate-pulse mx-auto mb-4" />
            ) : (
              <h1 className="text-3xl lg:text-5xl font-extrabold text-white font-heading mb-4">{category?.name}</h1>
            )}

            {loading ? (
              <div className="h-4 w-96 bg-white/5 rounded animate-pulse mx-auto" />
            ) : (
              category?.description && <p className="text-neutral-400 max-w-2xl mx-auto">{category.description}</p>
            )}

         </div>
      </div>

      <main className="bg-neutral-50 min-h-[60vh] pb-20">
        <div className="container-custom py-8">
          
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-neutral-100">
             <div className="text-sm font-medium text-neutral-500">
               {loading ? (
                 <span className="w-24 h-4 bg-neutral-200 rounded animate-pulse inline-block" />
               ) : (
                 <><strong className="text-neutral-900">{sortedProducts.length}</strong> ürün bulundu</>
               )}
             </div>

             <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-sm text-neutral-500 whitespace-nowrap hidden sm:inline">Sırala:</span>
                <div className="relative w-full sm:w-64">
                   <select 
                     value={sortOption} 
                     onChange={(e) => setSortOption(e.target.value as any)}
                     className="appearance-none w-full bg-neutral-50 border border-neutral-200 text-neutral-700 text-sm font-medium rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 cursor-pointer"
                   >
                     <option value="newest">En Yeniler</option>
                     <option value="price_asc">Fiyata Göre Artan</option>
                     <option value="price_desc">Fiyata Göre Azalan</option>
                   </select>
                   <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                </div>
             </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 xl:gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="card p-4 space-y-4">
                  <div className="aspect-square skeleton rounded-xl" />
                  <div className="h-4 w-3/4 skeleton" />
                  <div className="h-4 w-1/2 skeleton" />
                </div>
              ))}
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-neutral-100 border-dashed">
              <Search className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
              <h3 className="text-xl font-bold font-heading mb-2">Bu Kategoride Ürün Yok</h3>
              <p className="text-neutral-500">Bu kategoriye henüz bir ürün eklenmemiş gibi görünüyor.</p>
              <Link href="/kategori" className="btn btn-outline mt-6">Tüm Ürünleri Gör</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 xl:gap-6">
              {sortedProducts.map(product => {
                const coverImg = product.images?.find((img:any) => img.is_cover) || product.images?.[0]
                const discount = product.sale_price && product.price > 0 ? Math.round(((product.price - product.sale_price) / product.price) * 100) : null
                
                return (
                  <div key={product.id} className="card group relative flex flex-col h-full hover:shadow-lg transition-shadow">
                    <Link href={`/urun/${product.slug}`} className="relative aspect-square overflow-hidden bg-neutral-100 block cursor-pointer">
                      {coverImg ? (
                        <Image src={coverImg.url} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 50vw, 25vw" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center opacity-30 text-4xl"><ImageIcon className="w-12 h-12 text-neutral-400" /></div>
                      )}

                      {product.stock_quantity <= 0 && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20 z-10 flex items-center justify-center">
                          <span className="text-white font-bold text-lg tracking-[0.2em] uppercase drop-shadow-lg">TÜKENDİ</span>
                        </div>
                      )}
                      
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
                        {discount && discount > 0 ? (
                          <span className="bg-accent-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-md">%{discount} İNDİRİM</span>
                        ) : null}
                      </div>

                      {/* Favorite button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          toggleFavorite(product.id)
                        }}
                        className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all z-10 ${
                          isFavorite(product.id)
                            ? 'bg-red-50 text-red-500'
                            : 'bg-white/80 backdrop-blur-sm text-neutral-400 hover:text-red-500'
                        }`}
                        aria-label="Favorilere ekle"
                      >
                        <Heart className={`w-4 h-4 ${isFavorite(product.id) ? 'fill-current' : ''}`} />
                      </button>
                    </Link>

                    <div className="p-4 flex flex-col flex-1">
                      {product.brand && <p className="text-xs font-medium text-primary-600 mb-1">{product.brand}</p>}
                      <Link href={`/urun/${product.slug}`}>
                        <h3 className="font-heading text-sm font-semibold text-neutral-800 leading-snug mb-3 line-clamp-2 hover:text-primary-600 transition-colors">
                          {product.name}
                        </h3>
                      </Link>

                      <div className="mt-auto pt-4 border-t border-neutral-100">
                        <div className="flex items-end justify-between gap-2">
                          <div className="flex flex-col">
                            {product.sale_price && <span className="price-old">{formatPrice(product.price)}</span>}
                            <span className="price-current leading-none">{formatPrice(product.sale_price || product.price)}</span>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.preventDefault()
                              addToCart(product, 1)
                              alert('Sepete eklendi!')
                            }}
                            disabled={product.stock_quantity === 0}
                            className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center hover:bg-primary-600 hover:text-white transition-colors disabled:opacity-50 disabled:bg-neutral-100 disabled:text-neutral-400"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                        </div>
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
