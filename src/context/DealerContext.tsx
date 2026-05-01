'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'

interface DealerContextType {
  isDealer: boolean
  dealerDiscount: number | null  // general discount % from dealers table
  getDealerPrice: (basePrice: number, dealerPrice: number | null, dealerSalePrice?: number | null) => number | null
}

const DealerContext = createContext<DealerContextType>({
  isDealer: false,
  dealerDiscount: null,
  getDealerPrice: () => null,
})

export function DealerProvider({ children }: { children: ReactNode }) {
  const [isDealer, setIsDealer] = useState(false)
  const [dealerDiscount, setDealerDiscount] = useState<number | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabaseBrowser.auth.getSession()
      if (!session?.user) return

      const { data: profile } = await supabaseBrowser
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (profile?.role === 'dealer') {
        setIsDealer(true)
        const { data: dealer } = await supabaseBrowser
          .from('dealers')
          .select('discount_rate')
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .single()
        if (dealer) setDealerDiscount(dealer.discount_rate)
      }
    }
    init()

    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange(() => {
      setIsDealer(false)
      setDealerDiscount(null)
      init()
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

  return (
    <DealerContext.Provider value={{ isDealer, dealerDiscount, getDealerPrice }}>
      {children}
    </DealerContext.Provider>
  )
}

export function useDealer() {
  return useContext(DealerContext)
}
