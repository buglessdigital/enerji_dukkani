'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

export interface CartItem {
  id: string
  product_id: string
  name: string
  slug: string
  price: number
  sale_price: number | null
  image_url: string
  quantity: number
  stock_quantity: number
}

interface CartContextType {
  cart: CartItem[]
  addToCart: (product: any, quantity?: number) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  cartTotal: number
  cartCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

function getCartKey(userId: string | null) {
  return userId ? `enerji_dukkani_cart_${userId}` : 'enerji_dukkani_cart_guest'
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartKey, setCartKey] = useState<string>('enerji_dukkani_cart_guest')
  const [isLoaded, setIsLoaded] = useState(false)

  // Auth değişikliklerini dinle — kullanıcıya özel sepeti yükle/temizle
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      const key = getCartKey(session?.user?.id ?? null)
      setCartKey(key)
      try {
        const saved = localStorage.getItem(key)
        setCart(saved ? JSON.parse(saved) : [])
      } catch {
        setCart([])
      }
      setIsLoaded(true)
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const key = getCartKey(session?.user?.id ?? null)
      setCartKey(key)
      setIsLoaded(false)
      try {
        const saved = localStorage.getItem(key)
        setCart(saved ? JSON.parse(saved) : [])
      } catch {
        setCart([])
      }
      setIsLoaded(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Sepeti localStorage'a kaydet
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(cartKey, JSON.stringify(cart))
    }
  }, [cart, isLoaded, cartKey])

  const addToCart = (product: any, quantity: number = 1) => {
    setCart((prev) => {
      const existing = prev.find(item => item.product_id === product.id)
      if (existing) {
        return prev.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, item.stock_quantity) }
            : item
        )
      }

      const cover = Array.isArray(product.product_images)
        ? product.product_images.find((i: any) => i.is_cover)?.url || product.product_images[0]?.url
        : Array.isArray(product.images)
          ? product.images.find((i: any) => i.is_cover)?.url || product.images[0]?.url
          : ''

      return [...prev, {
        id: product.id,
        product_id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        sale_price: product.sale_price,
        image_url: cover || '',
        quantity: Math.min(quantity, product.stock_quantity || 1),
        stock_quantity: product.stock_quantity || 0,
      }]
    })
  }

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return
    setCart(prev => prev.map(item =>
      item.id === id ? { ...item, quantity: Math.min(quantity, item.stock_quantity) } : item
    ))
  }

  const clearCart = () => setCart([])

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const cartTotal = cart.reduce((total, item) => total + (item.sale_price || item.price) * item.quantity, 0)

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
