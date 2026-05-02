'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { sanitizeHtml } from '@/lib/sanitize'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/common/WhatsAppButton'
import { Heart, ShoppingCart, Star, Check, AlertCircle, Shield, Truck, RefreshCw, ChevronRight, ImageIcon, SearchX, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { supabaseBrowser } from '@/lib/supabase-browser'
import type { Product, SiteSettings } from '@/lib/types'
import { useCart } from '@/context/CartContext'
import type { VariantSelection } from '@/context/CartContext'
import { useDealer } from '@/context/DealerContext'
import { useFavorites } from '@/context/FavoritesContext'

function formatPrice(price: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { addToCart } = useCart()
  const router = useRouter()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'delivery' | 'reviews'>('desc')
  const [rating, setRating] = useState({ average: 0, count: 0 })
  const [reviews, setReviews] = useState<any[]>([])
  const [siteSettings, setSiteSettings] = useState<Partial<SiteSettings> | null>(null)
  const [authUser, setAuthUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const { getDealerPrice, isDealer, dealerDiscount } = useDealer()
  const { isFavorite: checkIsFavorite, toggleFavorite } = useFavorites()
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewHover, setReviewHover] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [similarProducts, setSimilarProducts] = useState<any[]>([])

  useEffect(() => {
    async function fetchProduct() {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          images:product_images(id, url, alt_text, sort_order, is_cover),
          variants:product_variants(id, name, value, price_modifier, stock_quantity, sort_order),
          category:categories(id, name, slug)
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (!error && data) {
        // Sort images by sort_order, cover first
        if (data.images) {
          data.images.sort((a: any, b: any) => {
            if (a.is_cover && !b.is_cover) return -1
            if (!a.is_cover && b.is_cover) return 1
            return a.sort_order - b.sort_order
          })
        }
        // Sort variants by sort_order
        if (data.variants) {
          data.variants.sort((a: any, b: any) => a.sort_order - b.sort_order)
        }
        setProduct(data)

        // Set default variant selections
        if (data.variants && data.variants.length > 0) {
          const variantGroups: Record<string, string> = {}
          const grouped = data.variants.reduce((acc: Record<string, any[]>, v: any) => {
            if (!acc[v.name]) acc[v.name] = []
            acc[v.name].push(v)
            return acc
          }, {})
          Object.entries(grouped).forEach(([name, values]) => {
            variantGroups[name] = (values as any[])[0]?.value || ''
          })
          setSelectedVariants(variantGroups)
        }

        // Fetch approved reviews with profile names
        const { data: reviewData } = await supabase
          .from('reviews')
          .select('*, user:profiles(full_name)')
          .eq('product_id', data.id)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })

        if (reviewData && reviewData.length > 0) {
          setReviews(reviewData)
          const sum = reviewData.reduce((acc: number, r: any) => acc + r.rating, 0)
          setRating({
            average: Math.round((sum / reviewData.length) * 10) / 10,
            count: reviewData.length
          })
        }
      }

      const { data: set } = await supabase.from('site_settings').select('whatsapp_number, phone, feature_shipping_title, feature_shipping_desc, feature_guarantee_title, feature_guarantee_desc, feature_return_title, feature_return_desc, delivery_shipping_text, delivery_return_text').single()
      if (set) {
        setSiteSettings(set)
      }

      // Benzer ürünler
      if (data?.category_id) {
        const { data: similar } = await supabase
          .from('products')
          .select('id, name, slug, price, sale_price, images:product_images(url, is_cover)')
          .eq('category_id', data.category_id)
          .eq('is_active', true)
          .neq('id', data.id)
          .limit(4)
        if (similar) setSimilarProducts(similar)
      }

      setLoading(false)
    }
    fetchProduct()
  }, [slug])

  useEffect(() => {
    supabaseBrowser.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setAuthUser(session.user)
        const { data: profile } = await supabaseBrowser.from('profiles').select('full_name, role').eq('id', session.user.id).single()
        if (profile) setUserProfile(profile)
      }
    })
  }, [])

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reviewRating) { setReviewError('Lütfen bir puan seçin.'); return }
    if (!authUser) { setReviewError('Yorum yapabilmek için giriş yapmalısınız.'); return }
    setReviewError('')
    setReviewSubmitting(true)
    const { error } = await supabaseBrowser.from('reviews').insert({
      product_id: product!.id,
      user_id: authUser.id,
      rating: reviewRating,
      comment: reviewComment.trim() || null,
      status: 'pending'
    })
    setReviewSubmitting(false)
    if (error) {
      setReviewError('Yorum gönderilirken bir hata oluştu. Lütfen tekrar deneyin.')
    } else {
      setReviewSubmitted(true)
      setReviewRating(0)
      setReviewComment('')
    }
  }

  // Group variants by name
  const variantGroups = product?.variants?.reduce((acc: Record<string, any[]>, v) => {
    const name = v!.name
    if (!acc[name]) acc[name] = []
    acc[name].push(v!)
    return acc
  }, {} as Record<string, any[]>) || {}

  const handleVariantSelect = (name: string, value: string) => {
    setSelectedVariants(prev => ({ ...prev, [name]: value }))
  }

  // Build selected variant objects from current selections
  const selectedVariantObjects: VariantSelection[] = Object.entries(selectedVariants)
    .map(([name, value]) => (variantGroups[name] as any[])?.find((v: any) => v.value === value))
    .filter(Boolean)

  // Effective price: base + sum of all selected variant modifiers
  const totalModifier = selectedVariantObjects.reduce((sum, v) => sum + (v.price_modifier || 0), 0)
  const effectivePrice = product ? product.price + totalModifier : 0
  const effectiveSalePrice = product?.sale_price != null ? product.sale_price + totalModifier : null
  const displayPrice = effectiveSalePrice ?? effectivePrice

  // Effective stock: minimum of product stock and each selected variant's stock
  const effectiveStock = product
    ? selectedVariantObjects.length > 0
      ? Math.min(product.stock_quantity, ...selectedVariantObjects.map(v => v.stock_quantity))
      : product.stock_quantity
    : 0

  // Get technical specs from JSONB
  const specs = product?.technical_specs || []

  // Loading State
  if (loading) {
    return (
      <>
        <Navbar />
        <main className="pt-[104px] lg:pt-[140px] bg-neutral-50 pb-20">
          <div className="container-custom py-4">
            <div className="h-4 w-64 skeleton rounded" />
          </div>
          <div className="container-custom mt-2">
            <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-4 sm:p-6 lg:p-10">
              <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
                <div className="lg:w-5/12">
                  <div className="aspect-[4/3] skeleton rounded-2xl" />
                  <div className="grid grid-cols-4 gap-3 mt-4">
                    {[1,2,3,4].map(i => <div key={i} className="aspect-[4/3] skeleton rounded-xl" />)}
                  </div>
                </div>
                <div className="lg:w-7/12 space-y-4">
                  <div className="h-4 w-24 skeleton rounded" />
                  <div className="h-10 w-full skeleton rounded-lg" />
                  <div className="h-8 w-40 skeleton rounded-lg" />
                  <div className="h-20 w-full skeleton rounded-lg" />
                  <div className="h-12 w-full skeleton rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  // Product Not Found
  if (!product) {
    return (
      <>
        <Navbar />
        <main className="pt-[104px] lg:pt-[140px] bg-neutral-50 pb-20">
          <div className="container-custom mt-20 text-center">
            <SearchX className="w-20 h-20 mx-auto mb-6 text-neutral-300" />
            <h1 className="text-2xl font-heading font-bold text-neutral-900 mb-3">Ürün Bulunamadı</h1>
            <p className="text-neutral-500 mb-8">Aradığınız ürün mevcut değil veya kaldırılmış olabilir.</p>
            <Link href="/" className="btn btn-primary">Ana Sayfaya Dön</Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const images = product.images || []
  const activeImg = images[activeImage]
  const discountPercent = product.discount_percent ||
    (effectiveSalePrice != null && effectivePrice > 0
      ? Math.round(((effectivePrice - effectiveSalePrice) / effectivePrice) * 100)
      : null)

  const dealerEffectivePrice = getDealerPrice(
    displayPrice,
    product.dealer_price != null ? product.dealer_price + totalModifier : null,
    product.dealer_sale_price != null ? product.dealer_sale_price + totalModifier : null
  )

  // Bayi indirimli fiyat varsa üstü çizili referans fiyat dealer_price olmalı (müşteri sale_price değil)
  const dealerListPrice = product.dealer_sale_price != null && product.dealer_price != null
    ? product.dealer_price + totalModifier
    : displayPrice

  const dealerDiscountPercent = dealerEffectivePrice != null && dealerListPrice > 0
    ? Math.round(((dealerListPrice - dealerEffectivePrice) / dealerListPrice) * 100)
    : null

  return (
    <>
      <Navbar />

      <main className="pt-[104px] lg:pt-[140px] bg-neutral-50 pb-24 md:pb-20">

        {/* Breadcrumb */}
        <div className="container-custom py-3 hidden sm:block">
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
            <Link href="/" className="hover:text-primary-600 transition-colors">Ana Sayfa</Link>
            <ChevronRight className="w-3 h-3" />
            {product.category && (
              <>
                <Link href={`/kategori/${product.category.slug}`} className="hover:text-primary-600 transition-colors">
                  {product.category.name}
                </Link>
                <ChevronRight className="w-3 h-3" />
              </>
            )}
            <span className="text-neutral-900 truncate">{product.name}</span>
          </div>
        </div>

        {/* Above the Fold - Product Details */}
        <div className="container-custom mt-2">
          <div className="bg-white rounded-none -mx-4 sm:mx-0 sm:rounded-3xl sm:shadow-sm sm:border sm:border-neutral-100 sm:p-6 lg:p-10">
            <div className="flex flex-col lg:flex-row gap-0 sm:gap-10 lg:gap-16">

              {/* Left: Gallery */}
              <div className="lg:w-5/12 flex-shrink-0 space-y-3">
                {/* Main Image */}
                <div className="aspect-[4/3] bg-neutral-100 sm:rounded-2xl overflow-hidden border-b sm:border border-neutral-100 relative group cursor-zoom-in">
                  {activeImg?.url ? (
                    <Image
                      src={activeImg.url}
                      alt={activeImg.alt_text || product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 40vw"
                      priority
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="w-24 h-24 text-neutral-400 opacity-20" />
                    </div>
                  )}

                  {product.stock_quantity <= 0 && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20 z-10 flex items-center justify-center pointer-events-none">
                      <span className="text-white font-extrabold text-3xl tracking-[0.2em] uppercase drop-shadow-lg">TÜKENDİ</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-neutral-900/5 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none" />
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-2.5 overflow-x-auto px-4 sm:px-0 pb-1 sm:grid sm:grid-cols-5 sm:gap-3 scrollbar-hide">
                    {images.map((img, i) => (
                      <button
                        key={img.id}
                        onClick={() => setActiveImage(i)}
                        className={`shrink-0 w-20 h-16 sm:w-auto sm:h-auto sm:aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all ${
                          activeImage === i ? 'border-primary-500' : 'border-transparent hover:border-primary-200'
                        }`}
                      >
                        <div className="w-full h-full relative bg-neutral-100">
                          <Image
                            src={img.url}
                            alt={img.alt_text || `Ürün görsel ${i + 1}`}
                            fill
                            className="object-cover"
                            sizes="100px"
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Info & Actions */}
              <div className="lg:w-7/12 flex flex-col pt-4 px-4 sm:px-0 sm:pt-2 lg:pt-0">

                <div className="flex items-center justify-between mb-3">
                  {product.brand && (
                    <span className="text-primary-600 font-bold text-sm tracking-wide uppercase">
                      {product.brand}
                    </span>
                  )}

                  {/* Reviews Status */}
                  {rating.count > 0 && (
                    <div className="flex items-center gap-1.5 bg-neutral-50 px-2.5 py-1 rounded-full border border-neutral-100">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-bold text-neutral-800">{rating.average}</span>
                      <span className="text-xs text-neutral-400">({rating.count} yorum)</span>
                    </div>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold text-neutral-900 leading-tight mb-4">
                  {product.name}
                </h1>

                <div className="flex flex-col gap-2 mb-6">
                  <div className="flex items-center gap-4">
                    {/* Price */}
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-3xl font-heading font-extrabold text-primary-700">
                        {formatPrice(dealerEffectivePrice ?? displayPrice)}
                      </span>
                      {(effectiveSalePrice != null || dealerEffectivePrice != null) && (
                        <span className="text-lg text-neutral-400 font-medium line-through">
                          {formatPrice(dealerEffectivePrice != null ? dealerListPrice : effectivePrice)}
                        </span>
                      )}
                    </div>
                    {/* Discount Badge */}
                    {dealerDiscountPercent && dealerDiscountPercent > 0 ? (
                      <div className="bg-blue-100 text-blue-700 font-bold text-xs px-3 py-1.5 rounded-lg border border-blue-200">
                        Bayi İndirimi %{dealerDiscountPercent}
                      </div>
                    ) : discountPercent && discountPercent > 0 ? (
                      <div className="bg-accent-100 text-accent-700 font-bold text-xs px-3 py-1.5 rounded-lg border border-accent-200">
                        %{discountPercent} İndirim
                      </div>
                    ) : null}
                  </div>
                  {dealerEffectivePrice != null && (
                    <p className="text-xs text-blue-600 font-medium">Bayi özel fiyatı uygulandı</p>
                  )}
                </div>

                {/* Short Description */}
                {product.short_description && (
                  <p className="text-neutral-600 leading-relaxed mb-8">
                    {product.short_description}
                  </p>
                )}

                {/* Divider */}
                <div className="h-px bg-neutral-100 mb-8" />

                {/* Variants */}
                {Object.entries(variantGroups).map(([name, variants]) => (
                  <div key={name} className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-semibold text-neutral-900 text-sm">{name}:</span>
                      <span className="text-sm text-primary-600 font-medium">
                        {selectedVariants[name]}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(variants as any[]).map(variant => {
                        const isSelected = selectedVariants[name] === variant.value
                        const isOutOfStock = variant.stock_quantity === 0
                        return (
                          <button
                            key={variant.id}
                            onClick={() => !isOutOfStock && handleVariantSelect(name, variant.value)}
                            disabled={isOutOfStock}
                            className={`relative px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                              isOutOfStock
                                ? 'border-neutral-100 bg-neutral-50 text-neutral-300 cursor-not-allowed line-through'
                                : isSelected
                                  ? 'border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-500 shadow-sm'
                                  : 'border-neutral-200 bg-white text-neutral-700 hover:border-primary-300 hover:bg-neutral-50'
                            }`}
                          >
                            {variant.value}
                            {variant.price_modifier !== 0 && !isOutOfStock && (
                              <span className="ml-1.5 text-xs opacity-60">
                                {variant.price_modifier > 0 ? '+' : ''}{formatPrice(variant.price_modifier)}
                              </span>
                            )}
                            {isOutOfStock && (
                              <span className="ml-1.5 text-xs text-neutral-300 no-underline" style={{ textDecoration: 'none' }}>Tükendi</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}

                {/* Stock Warning */}
                <div className="flex items-center gap-2 mb-6 text-sm">
                  {effectiveStock > 10 ? (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg font-medium border border-green-100">
                      <Check className="w-4 h-4" />
                      Stokta Var
                    </div>
                  ) : effectiveStock > 0 ? (
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg font-medium border border-amber-100">
                      <AlertCircle className="w-4 h-4" />
                      Son {effectiveStock} ürün kaldı!
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg font-medium border border-red-100">
                      <AlertCircle className="w-4 h-4" />
                      Tükendi
                    </div>
                  )}
                  {product.sku && (
                    <span className="text-neutral-400 text-xs">SKU: {product.sku}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 mt-auto">
                  {/* Quantity + Favorite icon */}
                  <div className="hidden sm:flex items-center gap-3">
                    <div className="flex items-center justify-between bg-neutral-100 rounded-xl p-1.5 w-36 border border-neutral-200 shrink-0">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 flex items-center justify-center text-neutral-600 hover:text-primary-600 hover:bg-white rounded-lg transition-colors"
                      >
                        -
                      </button>
                      <span className="font-bold text-neutral-900 w-8 text-center">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-10 h-10 flex items-center justify-center text-neutral-600 hover:text-primary-600 hover:bg-white rounded-lg transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => toggleFavorite(product.id)}
                      title={checkIsFavorite(product.id) ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                      className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
                        checkIsFavorite(product.id)
                          ? 'border-red-200 bg-red-50 text-red-500'
                          : 'border-neutral-200 bg-white text-neutral-400 hover:border-red-200 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${checkIsFavorite(product.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Sepete Ekle + Hemen Al — sadece desktop */}
                  <div className="hidden sm:flex gap-3">
                    <button
                      onClick={() => {
                        addToCart(product, quantity, selectedVariantObjects.length > 0 ? selectedVariantObjects : undefined, dealerEffectivePrice)
                        alert('Ürün sepete eklendi!')
                      }}
                      disabled={effectiveStock === 0}
                      className="btn btn-outline btn-lg flex-1 group border-primary-600 text-primary-600 hover:bg-primary-50"
                    >
                      <ShoppingCart className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                      Sepete Ekle
                    </button>
                    <button
                      onClick={() => {
                        addToCart(product, quantity, selectedVariantObjects.length > 0 ? selectedVariantObjects : undefined, dealerEffectivePrice)
                        router.push('/odeme')
                      }}
                      disabled={effectiveStock === 0}
                      className="btn btn-primary btn-lg flex-1 group"
                    >
                      <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      Hemen Al
                    </button>
                  </div>

                  {/* Mobile: Favori + WhatsApp yan yana */}
                  <div className="flex sm:hidden gap-3">
                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className={`h-12 w-12 shrink-0 rounded-xl border flex items-center justify-center transition-all ${
                        checkIsFavorite(product.id) ? 'border-red-200 bg-red-50 text-red-500' : 'border-neutral-200 bg-white text-neutral-400'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${checkIsFavorite(product.id) ? 'fill-current' : ''}`} />
                    </button>
                    <a
                      href={`https://wa.me/${(siteSettings?.whatsapp_number || '').replace(/\s/g, '').replace(/^\+/, '').replace(/^0/, '90')}?text=${encodeURIComponent(`Merhaba, aşağıdaki ürün hakkında bilgi almak istiyorum:\n\n*${product.name}*\n${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 items-center justify-center gap-2 h-12 rounded-xl font-semibold text-sm text-white"
                      style={{ backgroundColor: '#25D366' }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="w-4 h-4 fill-white shrink-0">
                        <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                      </svg>
                      WhatsApp ile Sipariş Ver
                    </a>
                  </div>

                  {/* Desktop: WhatsApp ile Sipariş Ver */}
                  <a
                    href={`https://wa.me/${(siteSettings?.whatsapp_number || '').replace(/\s/g, '').replace(/^\+/, '').replace(/^0/, '90')}?text=${encodeURIComponent(
                      `Merhaba, aşağıdaki ürün hakkında bilgi almak istiyorum:\n\n*${product.name}*\n${typeof window !== 'undefined' ? window.location.href : ''}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:flex items-center justify-center gap-2.5 w-full h-[52px] rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 text-white"
                    style={{ backgroundColor: '#25D366' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="w-5 h-5 fill-white shrink-0">
                      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                    </svg>
                    WhatsApp ile Sipariş Ver
                  </a>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights Row */}
        <div className="container-custom mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-neutral-900 text-sm">{siteSettings?.feature_shipping_title || 'Ücretsiz & Hızlı Kargo'}</h4>
                <p className="text-xs text-neutral-500 mt-0.5">{siteSettings?.feature_shipping_desc || 'Özenle paketlenmiş sigortalı gönderim'}</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-bold text-neutral-900 text-sm">{siteSettings?.feature_guarantee_title || 'Orijinal Ürün Garantisi'}</h4>
                <p className="text-xs text-neutral-500 mt-0.5">{siteSettings?.feature_guarantee_desc || 'Resmi distribütör veya üretici garantisi'}</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center shrink-0">
                <RefreshCw className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h4 className="font-bold text-neutral-900 text-sm">{siteSettings?.feature_return_title || 'Kolay İade & Değişim'}</h4>
                <p className="text-xs text-neutral-500 mt-0.5">{siteSettings?.feature_return_desc || '14 gün içerisinde koşulsuz iade hakkı'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Area: Tabs */}
        <div className="container-custom mt-8 lg:mt-12">
          <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden">

            {/* Tab Headers */}
            <div className="flex flex-col sm:flex-row sm:border-b border-neutral-100">
              <button
                onClick={() => setActiveTab('desc')}
                className={`px-6 sm:px-8 py-4 sm:py-5 text-left sm:text-center text-sm sm:text-base font-bold transition-colors border-l-4 sm:border-l-0 sm:border-b-2 ${
                  activeTab === 'desc' ? 'border-primary-600 bg-primary-50/50 sm:bg-transparent text-primary-600' : 'border-transparent sm:border-transparent text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
                }`}
              >
                Ürün Açıklaması
              </button>
              <button
                onClick={() => setActiveTab('specs')}
                className={`px-6 sm:px-8 py-4 sm:py-5 text-left sm:text-center text-sm sm:text-base font-bold transition-colors border-l-4 sm:border-l-0 sm:border-b-2 ${
                  activeTab === 'specs' ? 'border-primary-600 bg-primary-50/50 sm:bg-transparent text-primary-600' : 'border-transparent sm:border-transparent text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
                }`}
              >
                Teknik Özellikler
              </button>
              <button
                onClick={() => setActiveTab('delivery')}
                className={`px-6 sm:px-8 py-4 sm:py-5 text-left sm:text-center text-sm sm:text-base font-bold transition-colors border-l-4 sm:border-l-0 sm:border-b-2 ${
                  activeTab === 'delivery' ? 'border-primary-600 bg-primary-50/50 sm:bg-transparent text-primary-600' : 'border-transparent sm:border-transparent text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
                }`}
              >
                Teslimat ve İade
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-6 sm:px-8 py-4 sm:py-5 text-left sm:text-center text-sm sm:text-base font-bold transition-colors border-l-4 sm:border-l-0 sm:border-b-2 flex items-center gap-2 ${
                  activeTab === 'reviews' ? 'border-primary-600 bg-primary-50/50 sm:bg-transparent text-primary-600' : 'border-transparent sm:border-transparent text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
                }`}
              >
                Yorumlar
                {rating.count > 0 && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${activeTab === 'reviews' ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-500'}`}>
                    {rating.count}
                  </span>
                )}
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6 sm:p-10">

              {activeTab === 'desc' && product.description && (
                <div
                  className="prose prose-neutral max-w-4xl prose-p:leading-relaxed prose-li:text-neutral-600 prose-p:text-neutral-600"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }}
                />
              )}

              {activeTab === 'desc' && !product.description && (
                <p className="text-neutral-500">Bu ürün için henüz açıklama girilmemiş.</p>
              )}

              {activeTab === 'specs' && (
                <div className="max-w-3xl">
                  {(specs as any[]).length > 0 ? (
                    <table className="w-full text-sm text-left border-collapse">
                      <tbody>
                        {(specs as any[]).map((spec: any, i: number) => (
                          <tr key={i} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors">
                            <th className="py-4 px-4 font-semibold text-neutral-900 w-1/3 bg-neutral-50/50">{spec.key}</th>
                            <td className="py-4 px-4 text-neutral-600">{spec.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-neutral-500">Bu ürün için henüz teknik özellik girilmemiş.</p>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="max-w-3xl space-y-10">

                  {/* Özet */}
                  {rating.count > 0 && (
                    <div className="flex items-center gap-6 p-6 bg-neutral-50 rounded-2xl border border-neutral-100">
                      <div className="text-center shrink-0">
                        <div className="text-5xl font-extrabold text-neutral-900 font-heading leading-none">{rating.average}</div>
                        <div className="flex items-center justify-center gap-0.5 mt-2">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={`w-4 h-4 ${s <= Math.round(rating.average) ? 'text-amber-400 fill-amber-400' : 'text-neutral-200 fill-neutral-200'}`} />
                          ))}
                        </div>
                        <div className="text-xs text-neutral-500 mt-1">{rating.count} değerlendirme</div>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        {[5,4,3,2,1].map(star => {
                          const count = reviews.filter(r => r.rating === star).length
                          const pct = rating.count > 0 ? (count / rating.count) * 100 : 0
                          return (
                            <div key={star} className="flex items-center gap-2 text-xs">
                              <span className="w-3 text-neutral-500 font-medium text-right">{star}</span>
                              <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                              <div className="flex-1 bg-neutral-200 rounded-full h-1.5 overflow-hidden">
                                <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="w-5 text-neutral-400">{count}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Yorum Listesi */}
                  {reviews.length === 0 ? (
                    <div className="text-center py-8">
                      <Star className="w-12 h-12 mx-auto mb-3 text-neutral-200 fill-neutral-200" />
                      <p className="text-neutral-500 font-medium">Henüz yorum yapılmamış.</p>
                      <p className="text-neutral-400 text-sm mt-1">İlk yorumu siz yapın!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map(review => (
                        <div key={review.id} className="bg-white border border-neutral-100 rounded-2xl p-5 shadow-sm">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 font-bold text-sm flex items-center justify-center shrink-0">
                                {(review.user?.full_name || 'K').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-sm text-neutral-900">{review.user?.full_name || 'Müşteri'}</p>
                                <p className="text-xs text-neutral-400">{new Date(review.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-neutral-200 fill-neutral-200'}`} />
                              ))}
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-neutral-700 leading-relaxed">{review.comment}</p>
                          )}
                          {review.admin_reply && (
                            <div className="mt-3 pl-4 border-l-2 border-primary-200 bg-primary-50/50 rounded-r-xl py-2.5 pr-3">
                              <p className="text-xs font-bold text-primary-700 mb-1">Satıcı Yanıtı</p>
                              <p className="text-xs text-neutral-600 leading-relaxed">{review.admin_reply}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Yorum Formu */}
                  <div className="bg-neutral-50 rounded-2xl border border-neutral-100 p-6">
                    <h3 className="font-heading font-bold text-neutral-900 text-lg mb-5">Yorum Yaz</h3>

                    {!authUser ? (
                      <div className="text-center py-6">
                        <p className="text-neutral-500 mb-4">Yorum yapabilmek için giriş yapmanız gerekmektedir.</p>
                        <a href="/hesabim" className="btn btn-primary">Giriş Yap</a>
                      </div>
                    ) : reviewSubmitted ? (
                      <div className="text-center py-6">
                        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Check className="w-7 h-7 text-green-600" />
                        </div>
                        <p className="font-semibold text-neutral-900 mb-1">Yorumunuz alındı!</p>
                        <p className="text-sm text-neutral-500">İnceleme sonrasında yayınlanacaktır.</p>
                      </div>
                    ) : (
                      <form onSubmit={handleReviewSubmit} className="space-y-5">
                        <div>
                          <label className="block text-sm font-semibold text-neutral-800 mb-2">Puanınız <span className="text-red-500">*</span></label>
                          <div className="flex items-center gap-1">
                            {[1,2,3,4,5].map(s => (
                              <button
                                type="button"
                                key={s}
                                onMouseEnter={() => setReviewHover(s)}
                                onMouseLeave={() => setReviewHover(0)}
                                onClick={() => setReviewRating(s)}
                                className="p-1 transition-transform hover:scale-110"
                              >
                                <Star className={`w-7 h-7 transition-colors ${s <= (reviewHover || reviewRating) ? 'text-amber-400 fill-amber-400' : 'text-neutral-300 fill-neutral-300'}`} />
                              </button>
                            ))}
                            {reviewRating > 0 && (
                              <span className="ml-2 text-sm text-neutral-500">
                                {['','Çok Kötü','Kötü','Orta','İyi','Mükemmel'][reviewRating]}
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-neutral-800 mb-2">Yorumunuz <span className="text-neutral-400 font-normal">(isteğe bağlı)</span></label>
                          <textarea
                            value={reviewComment}
                            onChange={e => setReviewComment(e.target.value)}
                            rows={4}
                            maxLength={1000}
                            placeholder="Bu ürünü nasıl buldunuz? Deneyiminizi paylaşın..."
                            className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none bg-white"
                          />
                          <p className="text-xs text-neutral-400 mt-1 text-right">{reviewComment.length}/1000</p>
                        </div>

                        {reviewError && (
                          <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl border border-red-100">{reviewError}</p>
                        )}

                        <button
                          type="submit"
                          disabled={reviewSubmitting || !reviewRating}
                          className="btn btn-primary w-full sm:w-auto disabled:opacity-50"
                        >
                          {reviewSubmitting ? 'Gönderiliyor...' : 'Yorum Gönder'}
                        </button>
                      </form>
                    )}
                  </div>

                </div>
              )}

              {activeTab === 'delivery' && (
                <div className="max-w-4xl space-y-6 text-neutral-600 leading-relaxed text-sm">
                  <div>
                    <h4 className="font-bold text-neutral-900 mb-2 text-base">Gönderim Süreci</h4>
                    <p>{siteSettings?.delivery_shipping_text || 'Siparişleriniz, onaylandıktan sonra 1-3 iş günü içerisinde kargoya teslim edilmektedir.'}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-900 mb-2 text-base">İade Koşulları</h4>
                    <p>{siteSettings?.delivery_return_text || 'Satın aldığınız ürünleri, teslimat tarihinden itibaren 14 gün içerisinde iade edebilirsiniz.'}</p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Benzer Ürünler */}
        {similarProducts.length > 0 && (
          <section className="container-custom py-10">
            <h2 className="text-xl font-bold text-neutral-900 font-heading mb-6">Benzer Ürünler</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {similarProducts.map((p) => {
                const coverImg = p.images?.find((i: any) => i.is_cover) || p.images?.[0]
                const hasDiscount = p.sale_price && p.sale_price < p.price
                return (
                  <Link key={p.id} href={`/urun/${p.slug}`} className="group bg-white rounded-2xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <div className="aspect-square bg-neutral-50 overflow-hidden relative">
                      {coverImg ? (
                        <Image src={coverImg.url} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 50vw, 25vw" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-200">
                          <ImageIcon className="w-10 h-10" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold text-neutral-800 line-clamp-2 leading-snug mb-2">{p.name}</p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-bold text-primary-700">{formatPrice(hasDiscount ? p.sale_price : p.price)}</span>
                        {hasDiscount && <span className="text-xs text-neutral-400 line-through">{formatPrice(p.price)}</span>}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

      </main>

      {/* Mobile Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-100 px-4 py-3 flex items-center gap-3 z-50 sm:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex flex-col shrink-0">
          <span className="text-[11px] text-neutral-400 font-medium">
            {dealerEffectivePrice != null ? 'Bayi Fiyatı' : 'Fiyat'}
          </span>
          <span className="text-base font-extrabold text-primary-700 font-heading leading-tight">
            {formatPrice(dealerEffectivePrice ?? displayPrice)}
          </span>
          {dealerEffectivePrice != null && (
            <span className="text-[10px] text-blue-600 font-semibold">%{dealerDiscountPercent} indirim</span>
          )}
        </div>
        <button
          onClick={() => { addToCart(product, quantity, undefined, dealerEffectivePrice); alert('Ürün sepete eklendi!') }}
          disabled={product.stock_quantity === 0}
          className="flex-1 flex items-center justify-center gap-2 border-2 border-primary-600 text-primary-600 font-bold text-sm py-3 rounded-xl transition-colors active:bg-primary-50 disabled:opacity-40"
        >
          <ShoppingCart className="w-4 h-4" />
          Sepete Ekle
        </button>
        <button
          onClick={() => { addToCart(product, quantity, undefined, dealerEffectivePrice); router.push('/odeme') }}
          disabled={product.stock_quantity === 0}
          className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white font-bold text-sm py-3 rounded-xl shadow-md shadow-primary-200 transition-colors active:bg-primary-700 disabled:opacity-40"
        >
          <Zap className="w-4 h-4" />
          Hemen Al
        </button>
      </div>

      <Footer />
      <div className="hidden md:block">
        <WhatsAppButton />
      </div>
    </>
  )
}
