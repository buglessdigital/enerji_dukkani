'use client'

import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/context/CartContext'

export default function AddToCartButton({ product }: { product: any }) {
  const { addToCart } = useCart()
  const outOfStock = product.stock_quantity === 0

  return (
    <button
      onClick={(e) => { e.preventDefault(); addToCart(product, 1); alert('Sepete eklendi!') }}
      disabled={outOfStock}
      className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center hover:bg-primary-600 hover:text-white transition-colors disabled:opacity-50 disabled:bg-neutral-100 disabled:text-neutral-400"
    >
      <ShoppingCart className="w-4 h-4" />
    </button>
  )
}
