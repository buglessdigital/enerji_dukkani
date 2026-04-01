'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart, Star, Eye, ImageIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/context/CartContext'
import { useFavorites } from '@/context/FavoritesContext'
import type { Product } from '@/lib/types'

function formatPrice(price: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart()
  const { isFavorite, toggleFavorite } = useFavorites()
  const [isHovered, setIsHovered] = useState(false)
  
  const isFav = isFavorite(product.id)

  // Get cover image or first image
  const coverImage = product.images?.find(img => img.is_cover) || product.images?.[0]
  const imageUrl = coverImage?.url

  // Calculate discount percent if not set but sale_price exists
  const discountPercent = product.discount_percent || 
    (product.sale_price && product.price > 0 
      ? Math.round(((product.price - product.sale_price) / product.price) * 100) 
      : null)

  return (
    <div
      className="card group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <Link href={`/urun/${product.slug}`} className="relative aspect-square overflow-hidden bg-neutral-100 block cursor-pointer">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={coverImage?.alt_text || product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 to-neutral-100 flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-neutral-400 opacity-50" />
          </div>
        )}

        {/* Out of stock watermark */}
        {product.stock_quantity <= 0 && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20 z-10 flex items-center justify-center">
            <span className="text-white font-bold text-lg tracking-[0.2em] uppercase drop-shadow-lg">TÜKENDİ</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
          {discountPercent && discountPercent > 0 && (
            <span className="bg-accent-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-md">
              %{discountPercent} İNDİRİM
            </span>
          )}
        </div>

        {/* Favorite button */}
        <button
          onClick={(e) => {
            e.preventDefault()
            toggleFavorite(product.id)
          }}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all z-10 ${
            isFav
              ? 'bg-red-50 text-red-500'
              : 'bg-white/80 backdrop-blur-sm text-neutral-400 hover:text-red-500'
          }`}
          aria-label="Favorilere ekle"
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
        </button>

        {/* Quick action overlay */}
        <div
          className={`absolute inset-0 bg-transparent flex items-center justify-center gap-2 transition-opacity duration-300 pointer-events-none ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Sadece butonlar tıklandığında (pointer-events-auto) etkileşim alacak */}
          <button
            onClick={(e) => {
              e.preventDefault()
              addToCart(product, 1)
              alert('Ürün sepete eklendi!')
            }}
            disabled={product.stock_quantity === 0}
            className="w-11 h-11 pointer-events-auto bg-accent-500 rounded-xl flex items-center justify-center text-white hover:bg-accent-600 transition-colors shadow-lg disabled:bg-neutral-300 disabled:opacity-50"
            aria-label="Sepete ekle"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        {/* Brand */}
        {product.brand && (
          <p className="text-xs font-medium text-primary-600 mb-1">{product.brand}</p>
        )}

        {/* Name */}
        <Link href={`/urun/${product.slug}`}>
          <h3 className="font-heading text-sm font-semibold text-neutral-800 leading-snug mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating - only show if reviews exist */}
        {product.reviews && product.reviews.length > 0 && (
          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => {
                const avgRating = product.reviews!.reduce((acc, r) => acc + r.rating, 0) / product.reviews!.length
                return (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < Math.floor(avgRating)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-neutral-200'
                    }`}
                  />
                )
              })}
            </div>
            <span className="text-xs text-neutral-400">({product.reviews.length})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-end gap-2">
          <span className="price-current">
            {formatPrice(product.sale_price || product.price)}
          </span>
          {product.sale_price && (
            <span className="price-old">{formatPrice(product.price)}</span>
          )}
        </div>

        {/* Stock status */}
        <div className="mt-2 flex items-center gap-1">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              product.stock_quantity > 10
                ? 'bg-green-500'
                : product.stock_quantity > 0
                ? 'bg-amber-500'
                : 'bg-red-500'
            }`}
          />
          <span className="text-[11px] text-neutral-400">
            {product.stock_quantity > 10
              ? 'Stokta'
              : product.stock_quantity > 0
              ? `Son ${product.stock_quantity} adet`
              : 'Tükendi'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          images:product_images(id, url, alt_text, sort_order, is_cover),
          reviews:reviews(id, rating)
        `)
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(8)
      if (!error && data) {
        setProducts(data)
      }
      setLoading(false)
    }
    fetchProducts()
  }, [])

  if (loading) {
    return (
      <section className="section bg-neutral-50" id="featured-products">
        <div className="container-custom">
          <div className="text-center mb-10">
            <h2 className="section-title">Sizin İçin Seçtiklerimiz</h2>
            <p className="section-subtitle">En çok tercih edilen enerji ürünlerini keşfedin</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="card">
                <div className="aspect-square skeleton" />
                <div className="p-4 space-y-3">
                  <div className="h-3 w-16 skeleton" />
                  <div className="h-4 w-full skeleton" />
                  <div className="h-4 w-3/4 skeleton" />
                  <div className="h-5 w-20 skeleton" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return (
      <section className="section bg-neutral-50" id="featured-products">
        <div className="container-custom">
          <div className="text-center mb-10">
            <h2 className="section-title">Sizin İçin Seçtiklerimiz</h2>
            <p className="section-subtitle">Henüz öne çıkan ürün bulunamadı. Lütfen yönetim panelinden ürünleri öne çıkarın.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card bg-neutral-100/50 border border-neutral-200 border-dashed flex flex-col items-center justify-center h-64 text-neutral-400">
                <ImageIcon className="w-10 h-10 opacity-30 mb-2" />
                Ürün Yok
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="section bg-neutral-50" id="featured-products">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="section-title">Sizin İçin Seçtiklerimiz</h2>
          <p className="section-subtitle">
            En çok tercih edilen enerji ürünlerini keşfedin
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-10">
          <Link href="/kategori" className="btn btn-outline btn-lg">
            Tüm Ürünleri Gör
          </Link>
        </div>
      </div>
    </section>
  )
}
