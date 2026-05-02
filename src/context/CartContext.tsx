'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { supabaseBrowser } from '@/lib/supabase-browser'

export interface CartItem {
  id: string           // product_id + variant combination, unique per selection
  product_id: string
  variant_id?: string
  variant_label?: string   // e.g. "Güç: 400W, Renk: Siyah"
  name: string
  slug: string
  price: number        // effective price (base + variant modifier)
  sale_price: number | null  // effective sale price (base sale + variant modifier)
  dealer_price: number | null  // effective dealer price, null for non-dealers
  image_url: string
  quantity: number
  stock_quantity: number
}

export interface VariantSelection {
  id: string
  name: string
  value: string
  price_modifier: number
  stock_quantity: number
}

interface CartContextType {
  cart: CartItem[]
  addToCart: (product: any, quantity?: number, variants?: VariantSelection[], dealerPrice?: number | null) => void
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
    async function loadCartWithDealerPrices(userId: string | null) {
      const key = getCartKey(userId)
      setCartKey(key)

      let items: CartItem[] = []
      try {
        const saved = localStorage.getItem(key)
        items = saved ? JSON.parse(saved) : []
      } catch {
        items = []
      }

      // Bayi fiyatlarını yeniden hesapla
      if (userId && items.length > 0) {
        const { data: profile } = await supabaseBrowser
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single()

        if (profile?.role === 'dealer') {
          const { data: dealer } = await supabaseBrowser
            .from('dealers')
            .select('discount_rate')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single()

          const productIds = [...new Set(items.map(i => i.product_id))]
          const { data: products } = await supabaseBrowser
            .from('products')
            .select('id, price, dealer_price, dealer_sale_price')
            .in('id', productIds)

          const productMap = new Map(products?.map(p => [p.id, p]) ?? [])

          items = items.map(item => {
            const p = productMap.get(item.product_id)
            if (!p) return item
            let dp: number | null = null
            if (p.dealer_sale_price != null) dp = p.dealer_sale_price
            else if (p.dealer_price != null) dp = p.dealer_price
            else if (dealer?.discount_rate != null) dp = item.price * (1 - dealer.discount_rate / 100)
            return { ...item, dealer_price: dp }
          })
        } else {
          // Bayi değil — dealer_price sıfırla
          items = items.map(item => ({ ...item, dealer_price: null }))
        }
      } else {
        // Giriş yapılmamış — dealer_price sıfırla
        items = items.map(item => ({ ...item, dealer_price: null }))
      }

      setCart(items)
      setIsLoaded(true)
    }

    supabaseBrowser.auth.getSession().then(({ data: { session } }) => {
      loadCartWithDealerPrices(session?.user?.id ?? null)
    })

    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      setIsLoaded(false)
      loadCartWithDealerPrices(session?.user?.id ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Sepeti localStorage'a kaydet
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(cartKey, JSON.stringify(cart))
    }
  }, [cart, isLoaded, cartKey])

  const addToCart = (product: any, quantity: number = 1, variants?: VariantSelection[], dealerPrice?: number | null) => {
    setCart((prev) => {
      // Build a unique id that includes variant selection
      const variantKey = variants && variants.length > 0
        ? variants.map(v => v.id).sort().join('_')
        : ''
      const itemId = variantKey ? `${product.id}_${variantKey}` : product.id

      const existing = prev.find(item => item.id === itemId)

      // Calculate effective price: base + sum of all variant modifiers
      const totalModifier = variants?.reduce((sum, v) => sum + (v.price_modifier || 0), 0) ?? 0
      const effectivePrice = product.price + totalModifier
      const effectiveSalePrice = product.sale_price != null
        ? product.sale_price + totalModifier
        : null

      // Effective stock: minimum of product stock and each variant's stock
      const effectiveStock = variants && variants.length > 0
        ? Math.min(product.stock_quantity || 0, ...variants.map(v => v.stock_quantity))
        : (product.stock_quantity || 0)

      const variantLabel = variants && variants.length > 0
        ? variants.map(v => `${v.name}: ${v.value}`).join(', ')
        : undefined

      if (existing) {
        return prev.map(item =>
          item.id === itemId
            ? { ...item, quantity: Math.min(item.quantity + quantity, effectiveStock) }
            : item
        )
      }

      const cover = Array.isArray(product.product_images)
        ? product.product_images.find((i: any) => i.is_cover)?.url || product.product_images[0]?.url
        : Array.isArray(product.images)
          ? product.images.find((i: any) => i.is_cover)?.url || product.images[0]?.url
          : ''

      return [...prev, {
        id: itemId,
        product_id: product.id,
        variant_id: variants?.[0]?.id,
        variant_label: variantLabel,
        name: product.name,
        slug: product.slug,
        price: effectivePrice,
        sale_price: effectiveSalePrice,
        dealer_price: dealerPrice ?? null,
        image_url: cover || '',
        quantity: Math.min(quantity, effectiveStock || 1),
        stock_quantity: effectiveStock,
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
  const cartTotal = cart.reduce((total, item) => total + (item.dealer_price ?? item.sale_price ?? item.price) * item.quantity, 0)

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
