'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { ChevronDown, ShoppingCart, Eye, Search as SearchIcon, SearchX, ImageIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/context/CartContext'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/common/WhatsAppButton'
import SortDropdown from '@/components/common/SortDropdown'

function SearchResults() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''

  const { addToCart } = useCart()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [sortOption, setSortOption] = useState<'newest'|'price_asc'|'price_desc'>('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const PRODUCTS_PER_PAGE = 18

  function handleSortChange(v: string) {
    setSortOption(v as any)
    setCurrentPage(1)
  }

  useEffect(() => {
    async function searchProducts() {
      if (!query.trim()) {
        setProducts([])
        setLoading(false)
        return
      }

      setLoading(true)
      setFetchError('')

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          images:product_images(id, url, alt_text, sort_order, is_cover)
        `)
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,brand.ilike.%${query}%,description.ilike.%${query}%`)

      if (error) {
        setFetchError('Arama sırasında bir hata oluştu. Lütfen tekrar deneyin.')
      } else {
        setProducts(data || [])
      }
      setLoading(false)
    }

    searchProducts()
  }, [query])

  const sortedProducts = [...products].sort((a, b) => {
    const priceA = a.sale_price || a.price
    const priceB = b.sale_price || b.price

    if (sortOption === 'price_asc') return priceA - priceB
    if (sortOption === 'price_desc') return priceB - priceA
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const totalPages = Math.ceil(sortedProducts.length / PRODUCTS_PER_PAGE)
  const paginatedProducts = sortedProducts.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE)

  function formatPrice(price: number) {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(price)
  }

  return (
    <>
      {/* Arama Hero */}
      <div className="pt-[104px] lg:pt-[140px] bg-neutral-900 border-b border-neutral-800 relative overflow-hidden">
         <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary-500 via-transparent to-transparent" />

         <div className="container-custom py-10 relative z-10 text-center">
            <h1 className="text-3xl font-bold text-white font-heading mb-2">Arama Sonuçları</h1>
            {query ? (
              <p className="text-neutral-400">&quot;<span className="text-white font-medium">{query}</span>&quot; için sonuçlar gösteriliyor</p>
            ) : (
              <p className="text-neutral-400">Lütfen aramak istediğiniz kelimeyi girin.</p>
            )}
         </div>
      </div>

      <main className="bg-neutral-50 min-h-[50vh] pb-20">
        <div className="container-custom py-8">

          {query.trim() !== '' && (
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
                  <SortDropdown
                    value={sortOption}
                    onChange={handleSortChange}
                    options={[
                      { value: 'newest', label: 'En Yeniler' },
                      { value: 'price_asc', label: 'Fiyata Göre Artan' },
                      { value: 'price_desc', label: 'Fiyata Göre Azalan' },
                    ]}
                  />
               </div>
            </div>
          )}

          {fetchError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 font-medium mb-6">
              {fetchError}
            </div>
          )}

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
          ) : !query.trim() ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-neutral-100 border-dashed max-w-2xl mx-auto">
              <SearchIcon className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
              <h3 className="text-xl font-bold font-heading mb-2 text-neutral-800">Arama Yapın</h3>
              <p className="text-neutral-500">Üst menüdeki arama çubuğunu kullanarak ürün, marka veya model arayabilirsiniz.</p>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-neutral-100 border-dashed max-w-2xl mx-auto">
              <SearchX className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
              <h3 className="text-xl font-bold font-heading mb-2 text-neutral-800">Sonuç Bulunamadı</h3>
              <p className="text-neutral-500">&quot;{query}&quot; kelimesi ile eşleşen herhangi bir ürün bulamadık. Lütfen farklı bir kelime deneyin.</p>
              <Link href="/kategori" className="btn btn-outline mt-6">Tüm Ürünleri Gör</Link>
            </div>
          ) : (
            <>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 xl:gap-6">
              {paginatedProducts.map(product => {
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Önceki
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                      page === currentPage
                        ? 'bg-primary-600 text-white'
                        : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Sonraki →
                </button>
              </div>
            )}
            </>
          )}

        </div>
      </main>
    </>
  )
}

export default function SearchPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center pt-32">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        <SearchResults />
      </Suspense>
      <Footer />
      <WhatsAppButton />
    </>
  )
}
