'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface FavoritesContextType {
  favoriteIds: string[]
  toggleFavorite: (productId: string) => void
  isFavorite: (productId: string) => boolean
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load favorites from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('enerji_dukkani_favorites')
      if (stored) {
        setFavoriteIds(JSON.parse(stored))
      }
    } catch (e) {
      console.error('Could not load favorites', e)
    }
    setIsLoaded(true)
  }, [])

  // Save to local storage whenever it changes (only after initial load to prevent overwriting with [])
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('enerji_dukkani_favorites', JSON.stringify(favoriteIds))
      } catch (e) {
        console.error('Could not save favorites', e)
      }
    }
  }, [favoriteIds, isLoaded])

  const toggleFavorite = (productId: string) => {
    setFavoriteIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
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
