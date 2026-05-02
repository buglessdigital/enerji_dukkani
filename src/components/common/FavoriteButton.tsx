'use client'

import { Heart } from 'lucide-react'
import { useFavorites } from '@/context/FavoritesContext'

export default function FavoriteButton({ productId }: { productId: string }) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const active = isFavorite(productId)

  return (
    <button
      onClick={(e) => { e.preventDefault(); toggleFavorite(productId) }}
      className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all z-10 ${
        active ? 'bg-red-50 text-red-500' : 'bg-white/80 backdrop-blur-sm text-neutral-400 hover:text-red-500'
      }`}
      aria-label="Favorilere ekle"
    >
      <Heart className={`w-4 h-4 ${active ? 'fill-current' : ''}`} />
    </button>
  )
}
