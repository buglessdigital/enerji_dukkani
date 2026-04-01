'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/common/WhatsAppButton'
import { Heart, ShoppingCart, Star, Check, AlertCircle, Shield, Truck, RefreshCw, ChevronRight, ImageIcon, Phone, MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/lib/types'
import { useCart } from '@/context/CartContext'

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
  
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'delivery'>('desc')
  const [isFavorite, setIsFavorite] = useState(false)
  const [rating, setRating] = useState({ average: 0, count: 0 })
  const [siteSettings, setSiteSettings] = useState<{ whatsapp: string; phone: string } | null>(null)

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

        // Fetch approved review stats
        const { data: reviews } = await supabase
          .from('reviews')
          .select('rating')
          .eq('product_id', data.id)
          .eq('status', 'approved')
        
        if (reviews && reviews.length > 0) {
          const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
          setRating({
            average: Math.round((sum / reviews.length) * 10) / 10,
            count: reviews.length
          })
        }
      }
      
      const { data: set } = await supabase.from('site_settings').select('whatsapp_number, contact_phone').single()
      if (set) {
        setSiteSettings({
          whatsapp: set.whatsapp_number,
          phone: set.contact_phone
        })
      }

      setLoading(false)
    }
    fetchProduct()
  }, [slug])

  // Group variants by name
  const variantGroups = product?.variants?.reduce((acc: Record<string, typeof product.variants>, v) => {
    const name = v!.name
    if (!acc[name]) acc[name] = []
    acc[name].push(v!)
    return acc
  }, {} as Record<string, any[]>) || {}

  const handleVariantSelect = (name: string, value: string) => {
    setSelectedVariants(prev => ({ ...prev, [name]: value }))
  }

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
                  <div className="aspect-square skeleton rounded-2xl" />
                  <div className="grid grid-cols-4 gap-3 mt-4">
                    {[1,2,3,4].map(i => <div key={i} className="aspect-square skeleton rounded-xl" />)}
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
            <div className="text-6xl mb-6">🔍</div>
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
    (product.sale_price && product.price > 0 
      ? Math.round(((product.price - product.sale_price) / product.price) * 100) 
      : null)

  return (
    <>
      <Navbar />
      
      <main className="pt-[104px] lg:pt-[140px] bg-neutral-50 pb-28 md:pb-20">
        
        {/* Breadcrumb */}
        <div className="container-custom py-4">
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
          <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-4 sm:p-6 lg:p-10">
            <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
              
              {/* Left: Gallery */}
              <div className="lg:w-5/12 flex-shrink-0 space-y-4">
                {/* Main Image */}
                <div className="aspect-square bg-gradient-to-br from-neutral-100 to-neutral-50 rounded-2xl overflow-hidden border border-neutral-100 relative group cursor-zoom-in">
                  {activeImg?.url ? (
                    <Image
                      src={activeImg.url}
                      alt={activeImg.alt_text || product.name}
                      fill
                      className="object-contain p-4"
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
                  <div className="grid grid-cols-4 gap-3 md:gap-4">
                    {images.map((img, i) => (
                      <button
                        key={img.id}
                        onClick={() => setActiveImage(i)}
                        className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                          activeImage === i ? 'border-primary-500' : 'border-transparent hover:border-primary-200'
                        }`}
                      >
                        <div className="w-full h-full relative bg-neutral-100">
                          <Image
                            src={img.url}
                            alt={img.alt_text || `Ürün görsel ${i + 1}`}
                            fill
                            className="object-contain p-1"
                            sizes="100px"
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Info & Actions */}
              <div className="lg:w-7/12 flex flex-col pt-2 lg:pt-0">
                
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
                
                <div className="flex items-center gap-4 mb-6">
                  {/* Price */}
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-3xl font-heading font-extrabold text-primary-700">
                      {formatPrice(product.sale_price || product.price)}
                    </span>
                    {product.sale_price && (
                      <span className="text-lg text-neutral-400 font-medium line-through">
                        {formatPrice(product.price)}
                      </span>
                    )}
                  </div>
                  {/* Discount Badge */}
                  {discountPercent && discountPercent > 0 && (
                    <div className="bg-accent-100 text-accent-700 font-bold text-xs px-3 py-1.5 rounded-lg border border-accent-200">
                      %{discountPercent} İndirim
                    </div>
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
                  <div key={name} className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-neutral-900">{name}</span>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {(variants as any[]).map(variant => (
                        <button
                          key={variant.id}
                          onClick={() => handleVariantSelect(name, variant.value)}
                          className={`px-5 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                            selectedVariants[name] === variant.value
                              ? 'border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-500'
                              : 'border-neutral-200 bg-white text-neutral-700 hover:border-primary-200 hover:bg-neutral-50'
                          }`}
                        >
                          {variant.value}
                          {variant.price_modifier !== 0 && (
                            <span className="ml-1 text-xs text-neutral-400">
                              ({variant.price_modifier > 0 ? '+' : ''}{formatPrice(variant.price_modifier)})
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Stock Warning */}
                <div className="flex items-center gap-2 mb-6 text-sm">
                  {product.stock_quantity > 10 ? (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg font-medium border border-green-100">
                      <Check className="w-4 h-4" />
                      Stokta Var
                    </div>
                  ) : product.stock_quantity > 0 ? (
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg font-medium border border-amber-100">
                      <AlertCircle className="w-4 h-4" />
                      Son {product.stock_quantity} ürün kaldı!
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
                <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                  {/* Quantity */}
                  <div className="flex items-center justify-between bg-neutral-100 rounded-xl p-1.5 w-full sm:w-32 border border-neutral-200">
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
                  
                  {/* Add to cart */}
                  <button 
                    onClick={() => {
                      addToCart(product, quantity)
                      alert('Ürün sepete eklendi!')
                    }}
                    className="btn btn-primary btn-lg flex-1 group" 
                    disabled={product.stock_quantity === 0}
                  >
                    <ShoppingCart className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                    Sepete Ekle
                  </button>

                  {/* Favorite */}
                  <button 
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={`w-14 h-[52px] rounded-xl border flex items-center justify-center transition-all shrink-0 ${
                      isFavorite 
                        ? 'border-red-200 bg-red-50 text-red-500' 
                        : 'border-neutral-200 bg-white text-neutral-500 hover:border-red-200 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
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
                <h4 className="font-bold text-neutral-900 text-sm">Ücretsiz & Hızlı Kargo</h4>
                <p className="text-xs text-neutral-500 mt-0.5">Özenle paketlenmiş sigortalı gönderim</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-bold text-neutral-900 text-sm">Orijinal Ürün Garantisi</h4>
                <p className="text-xs text-neutral-500 mt-0.5">Resmi distribütör veya üretici garantisi</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center shrink-0">
                <RefreshCw className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h4 className="font-bold text-neutral-900 text-sm">Kolay İade & Değişim</h4>
                <p className="text-xs text-neutral-500 mt-0.5">14 gün içerisinde koşulsuz iade hakkı</p>
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
            </div>

            {/* Tab Content */}
            <div className="p-6 sm:p-10">
              
              {activeTab === 'desc' && product.description && (
                <div 
                  className="prose prose-neutral max-w-4xl prose-p:leading-relaxed prose-li:text-neutral-600 prose-p:text-neutral-600"
                  dangerouslySetInnerHTML={{ __html: product.description }}
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

              {activeTab === 'delivery' && (
                <div className="max-w-4xl space-y-6 text-neutral-600 leading-relaxed text-sm">
                  <div>
                    <h4 className="font-bold text-neutral-900 mb-2 text-base">Gönderim Süreci</h4>
                    <p>Siparişleriniz, onaylandıktan sonra 1-3 iş günü içerisinde kargoya teslim edilmektedir. Özel üretim gerektiren veya &quot;Ön Sipariş&quot; statüsündeki ürünlerin teslim süreleri ürün sayfasında ayrıca belirtilmektedir. Kargo firması tarafından size iletilen takip numarası ile sipariş durumunuzu Hesabım &gt; Siparişlerim sayfasından takip edebilirsiniz.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-900 mb-2 text-base">İade Koşulları</h4>
                    <p>Satın aldığınız ürünleri, teslimat tarihinden itibaren 14 gün içerisinde herhangi bir mazeret belirtmeksizin iade edebilirsiniz. İade edilecek ürünün orijinal ambalajında, kullanılmamış ve tekrar satılabilir özelliğini yitirmemiş olması gerekmektedir. Güneş paneli gibi kırılgan büyük hacimli ürünlerin iade gönderimlerinde, ürünün tarafınıza ulaştığı şekilde korunaklı (paletli vb.) sevk edilmesi zorunludur.</p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

      </main>

      {/* Mobile Sticky Contact Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-100 p-3 flex items-center justify-between gap-3 z-50 md:hidden shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <a 
          href={`https://wa.me/${siteSettings?.whatsapp?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Merhaba, ' + (product?.name || 'ürün') + ' hakkında bilgi almak istiyorum.')}`}
          target="_blank"
          rel="noreferrer"
          className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 px-4 rounded-xl font-bold text-sm hover:bg-[#128C7E] transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          WhatsApp
        </a>
        <a 
          href={`tel:${siteSettings?.phone?.replace(/[^0-9+]/g, '')}`} 
          className="flex-1 flex items-center justify-center gap-2 bg-neutral-900 text-white py-3 px-4 rounded-xl font-bold text-sm hover:bg-neutral-800 transition-colors"
        >
          <Phone className="w-5 h-5 fill-current" />
          Bizi Arayın
        </a>
      </div>

      <Footer />
      <div className="hidden md:block">
        <WhatsAppButton />
      </div>
    </>
  )
}
