'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'

interface FavoritesContextType {
  favoriteIds: string[]
  toggleFavorite: (productId: string) => void
  isFavorite: (productId: string) => boolean
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

const LOCAL_KEY = 'enerji_dukkani_favorites'

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Auth durumunu izle ve favorileri yükle
  useEffect(() => {
    let mounted = true

    async function init(uid: string | null) {
      if (!mounted) return

      if (uid) {
        // Giriş yapılmış: Supabase'den çek
        const { data } = await supabaseBrowser
          .from('favorites')
          .select('product_id')
          .eq('user_id', uid)

        if (!mounted) return

        const dbIds = (data || []).map((r: any) => r.product_id)

        // localStorage'daki misafir favorilerini Supabase'e aktar
        try {
          const stored = localStorage.getItem(LOCAL_KEY)
          if (stored) {
            const localIds: string[] = JSON.parse(stored)
            const toInsert = localIds.filter(id => !dbIds.includes(id))
            if (toInsert.length > 0) {
              await supabaseBrowser.from('favorites').insert(
                toInsert.map(product_id => ({ user_id: uid, product_id }))
              )
              localStorage.removeItem(LOCAL_KEY)
              if (mounted) setFavoriteIds([...new Set([...dbIds, ...toInsert])])
            } else {
              localStorage.removeItem(LOCAL_KEY)
              if (mounted) setFavoriteIds(dbIds)
            }
          } else {
            if (mounted) setFavoriteIds(dbIds)
          }
        } catch {
          if (mounted) setFavoriteIds(dbIds)
        }
      } else {
        // Misafir: localStorage'dan yükle
        try {
          const stored = localStorage.getItem(LOCAL_KEY)
          if (stored && mounted) setFavoriteIds(JSON.parse(stored))
        } catch {}
      }

      if (mounted) setIsLoaded(true)
    }

    supabaseBrowser.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id ?? null
      setUserId(uid)
      init(uid)
    })

    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null
      setUserId(uid)
      setIsLoaded(false)
      setFavoriteIds([])
      init(uid)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Misafir için localStorage'a kaydet
  useEffect(() => {
    if (isLoaded && !userId) {
      try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(favoriteIds))
      } catch {}
    }
  }, [favoriteIds, isLoaded, userId])

  const toggleFavorite = async (productId: string) => {
    const isCurrentlyFav = favoriteIds.includes(productId)

    // Optimistic update
    setFavoriteIds(prev =>
      isCurrentlyFav ? prev.filter(id => id !== productId) : [...prev, productId]
    )

    if (userId) {
      if (isCurrentlyFav) {
        await supabaseBrowser
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('product_id', productId)
      } else {
        await supabaseBrowser
          .from('favorites')
          .insert({ user_id: userId, product_id: productId })
      }
    }
  }

  const isFavorite = (productId: string) => favoriteIds.includes(productId)

  return (
    <FavoritesContext.Provider value={{ favoriteIds, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}
