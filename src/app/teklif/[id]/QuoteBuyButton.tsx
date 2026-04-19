'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/context/CartContext'
import type { QuoteItem } from '@/lib/types'

interface Props {
  items: QuoteItem[]
  quoteId: string
}

export default function QuoteBuyButton({ items, quoteId }: Props) {
  const [loading, setLoading] = useState(false)
  const { addToCart, clearCart } = useCart()
  const router = useRouter()

  async function handleBuy() {
    setLoading(true)

    // Fetch product details (slug, stock_quantity) for all items
    const productIds = items.map(i => i.product_id)
    const { data: products } = await supabase
      .from('products')
      .select('id, name, slug, price, sale_price, stock_quantity, product_images(url, is_cover)')
      .in('id', productIds)

    if (!products || products.length === 0) {
      setLoading(false)
      return
    }

    clearCart()

    for (const item of items) {
      const product = products.find(p => p.id === item.product_id)
      if (!product) continue

      // Override with quoted price as sale_price
      addToCart(
        {
          ...product,
          sale_price: item.unit_price,
          images: product.product_images,
        },
        item.quantity
      )
    }

    // Mark quote as accepted
    await supabase.from('quotes').update({ status: 'accepted' }).eq('id', quoteId)

    router.push('/odeme')
  }

  return (
    <button
      onClick={handleBuy}
      disabled={loading}
      className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-colors shadow-md shadow-primary-200"
    >
      {loading ? (
        <><Loader2 className="w-4 h-4 animate-spin" /> Yükleniyor...</>
      ) : (
        <><ShoppingCart className="w-4 h-4" /> Teklifi Satın Al</>
      )}
    </button>
  )
}
