'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'

interface DealerContextType {
  isDealer: boolean
  dealerDiscount: number | null  // general discount % from dealers table
  getDealerPrice: (basePrice: number, dealerPrice: number | null, dealerSalePrice?: number | null) => number | null
  getDiscountBadge: (product: any) => number | null
}

const DealerContext = createContext<DealerContextType>({
  isDealer: false,
  dealerDiscount: null,
  getDealerPrice: () => null,
  getDiscountBadge: () => null,
})

interface DealerProviderProps {
  children: ReactNode
  initialIsDealer?: boolean
  initialDealerDiscount?: number | null
}

export function DealerProvider({ children, initialIsDealer = false, initialDealerDiscount = null }: DealerProviderProps) {
  const [isDealer, setIsDealer] = useState(initialIsDealer)
  const [dealerDiscount, setDealerDiscount] = useState<number | null>(initialDealerDiscount)

  useEffect(() => {
    // userId parametresini dışarıdan alarak race condition'ı engelliyoruz.
    // Artık onAuthStateChange'den gelen session doğrudan kullanılıyor,
    // içeride getSession() tekrar çağrılmıyor.
    async function loadDealer(userId: string) {
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
        setIsDealer(true)
        setDealerDiscount(dealer?.discount_rate ?? null)
      } else {
        setIsDealer(false)
        setDealerDiscount(null)
      }
    }

    // Sonraki auth değişikliklerini (giriş/çıkış/token yenileme) dinle.
    // onAuthStateChange'den gelen session'ı doğrudan kullan.
    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadDealer(session.user.id)
      } else {
        setIsDealer(false)
        setDealerDiscount(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  function getDealerPrice(basePrice: number, dealerPrice: number | null, dealerSalePrice?: number | null): number | null {
    if (!isDealer) return null
    // dealer_sale_price (indirimli bayi fiyatı) varsa önce onu kullan
    if (dealerSalePrice != null) return dealerSalePrice
    if (dealerPrice != null) return dealerPrice
    if (dealerDiscount != null) return basePrice * (1 - dealerDiscount / 100)
    return null
  }

  function getDiscountBadge(product: any): number | null {
    let discountPercent = product.discount_percent || null
    if (isDealer) {
      if (product.dealer_discount_percent != null) {
        discountPercent = product.dealer_discount_percent
      } else if (product.dealer_sale_price != null && product.dealer_price != null && product.dealer_price > 0) {
        discountPercent = Math.round(((product.dealer_price - product.dealer_sale_price) / product.dealer_price) * 100)
      } else if (dealerDiscount != null) {
        discountPercent = dealerDiscount // Genel bayi iskontosu
      } else {
        discountPercent = null // Bayiye özel bir iskonto yok
      }
    } else {
      if (!discountPercent && product.sale_price && product.price > 0) {
        discountPercent = Math.round(((product.price - product.sale_price) / product.price) * 100)
      }
    }
    return discountPercent > 0 ? discountPercent : null
  }

  return (
    <DealerContext.Provider value={{ isDealer, dealerDiscount, getDealerPrice, getDiscountBadge }}>
      {children}
    </DealerContext.Provider>
  )
}

export function useDealer() {
  return useContext(DealerContext)
}
