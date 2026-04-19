'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search,
  Heart,
  ShoppingCart,
  User,
  Menu,
  X,
  ChevronDown,
  Phone
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/context/CartContext'
import { useFavorites } from '@/context/FavoritesContext'
import type { Category, SiteSettings } from '@/lib/types'

export default function Navbar() {
  const router = useRouter()
  const { cartCount } = useCart()
  const { favoriteIds } = useFavorites()
  const [categories, setCategories] = useState<Category[]>([])
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const navRef = useRef<HTMLDivElement>(null)

  // Fetch categories & site settings from Supabase
  useEffect(() => {
    async function fetchData() {
      // Fetch categories
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      
      if (catData) {
        const allCats = catData as Category[]
        const rootCats = allCats.filter(c => !c.parent_id)
        rootCats.forEach(parent => {
          parent.children = allCats.filter(c => c.parent_id === parent.id)
          parent.children.forEach((child: Category) => {
            child.children = allCats.filter(c => c.parent_id === child.id)
          })
        })
        setCategories(rootCats)
      }

      // Fetch site settings
      const { data: settingsData } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .single()
      
      if (settingsData) {
        setSettings(settingsData)
      }
    }
    fetchData()
  }, [])

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchOpen])

  // Prevent body scroll when menu or search is open on mobile
  useEffect(() => {
    // Only lock on desktop if needed, on mobile it causes iOS Safari jump bugs
    // We will handle it by just using absolute positioning instead.
  }, [isMenuOpen, isSearchOpen])

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false)
        setActiveCategoryId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e: any) => {
    if (e.key === 'Enter' || e.type === 'click') {
      if (searchQuery.trim()) {
        router.push(`/arama?q=${encodeURIComponent(searchQuery.trim())}`)
        setIsSearchOpen(false)
        setSearchQuery('')
      }
    }
  }

  const phoneDisplay = settings?.phone || ''
  const phoneHref = phoneDisplay.replace(/\s/g, '')
  const freeShippingText = settings?.shipping_free_threshold 
    ? `${settings.shipping_free_threshold}₺ üzeri ücretsiz kargo` 
    : '500₺ üzeri ücretsiz kargo'

  return (
    <header
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.06)]'
          : 'bg-white'
      }`}
    >
      {/* Top bar */}
      <div className="bg-primary-700 text-white">
        <div className="container-custom flex items-center justify-between py-1.5 text-[10px] sm:text-xs">
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {phoneDisplay && (
              <a href={`tel:${phoneHref}`} className="flex items-center gap-1 hover:text-accent-300 transition-colors whitespace-nowrap">
                <Phone className="w-3 h-3" />
                <span>{phoneDisplay}</span>
              </a>
            )}
            <span className="hidden sm:inline text-primary-300">|</span>
            <span className="hidden sm:inline text-primary-200 whitespace-nowrap">
              {freeShippingText}
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 overflow-hidden ml-2">
            <Link href="/bayilik-basvurusu" className="hover:text-accent-300 transition-colors whitespace-nowrap hidden min-[360px]:block">
              Bayilik
            </Link>
            <span className="text-primary-400 hidden min-[360px]:block">|</span>
            <Link href="/hakkimizda" className="hover:text-accent-300 transition-colors whitespace-nowrap">
              Hakkımızda
            </Link>
            <span className="text-primary-400">|</span>
            <Link href="/iletisim" className="hover:text-accent-300 transition-colors whitespace-nowrap">
              İletişim
            </Link>
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 lg:h-[72px]">
          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 -ml-2 text-neutral-600 hover:text-primary-600 transition-colors"
            aria-label="Menü"
            id="mobile-menu-btn"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0" id="nav-logo">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M13 2L4 14h7l-2 8 9-12h-7l2-8z" fill="currentColor" />
                </svg>
              </div>
            <div className="hidden sm:block">
              <span className="block font-heading text-lg font-bold text-neutral-900 leading-tight">
                {settings?.site_name || 'Enerji Dükkanı'}
              </span>
              <span className="block text-[10px] text-neutral-400 font-medium tracking-wider uppercase">
                Güneş Enerjisi Sistemleri
              </span>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex items-center flex-1 max-w-xl mx-8">
            <div className="relative w-full group">
              <input
                type="text"
                placeholder="Ürün, marka veya kategori ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                className="w-full pl-4 pr-12 py-2.5 bg-neutral-100 border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                id="desktop-search-input"
              />
              <button
                onClick={handleSearch}
                className="absolute right-1 top-1/2 -translate-y-1/2 bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-lg transition-colors"
                aria-label="Ara"
                id="desktop-search-btn"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Mobile search toggle */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="lg:hidden p-2 text-neutral-600 hover:text-primary-600 transition-colors"
              aria-label="Ara"
              id="mobile-search-btn"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Favorites */}
            <Link
              href="/favoriler"
              className="relative p-2 text-neutral-600 hover:text-primary-600 transition-colors"
              id="nav-favorites"
            >
              <Heart className="w-5 h-5" />
              {favoriteIds.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-accent-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {favoriteIds.length}
                </span>
              )}
            </Link>

            {/* Account */}
            <Link
              href="/hesabim"
              className="p-2 text-neutral-600 hover:text-primary-600 transition-colors"
              id="nav-account"
            >
              <User className="w-5 h-5" />
            </Link>

            {/* Cart */}
            <Link
              href="/sepet"
              className="relative flex items-center gap-2 ml-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors"
              id="nav-cart"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-semibold">Sepetim</span>
              <span className="bg-white text-primary-700 text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Category Navigation - Desktop */}
      <nav className="hidden lg:block border-t border-neutral-100 bg-white">
        <div className="container-custom">
          <ul className="flex items-center gap-0">
            {categories.map((cat) => (
              <li
                key={cat.id}
                className="relative"
                onMouseEnter={() => setActiveCategoryId(cat.id)}
                onMouseLeave={() => setActiveCategoryId(null)}
              >
                <Link
                  href={`/kategori/${cat.slug}`}
                  className={`flex items-center gap-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeCategoryId === cat.id
                      ? 'text-primary-600'
                      : 'text-neutral-700 hover:text-primary-600'
                  }`}
                >
                  {cat.name}
                  {cat.children && cat.children.length > 0 && (
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${
                        activeCategoryId === cat.id ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </Link>

                {/* Dropdown */}
                {cat.children && cat.children.length > 0 && activeCategoryId === cat.id && (
                  <div className="absolute top-full left-0 w-56 bg-white rounded-b-xl shadow-dropdown border border-neutral-100 py-2 animate-slide-down z-50">
                    {cat.children.map((child) => (
                      <div key={child.id}>
                        <Link
                          href={`/kategori/${child.slug}`}
                          className="block px-4 py-2.5 text-sm text-neutral-600 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                        >
                          {child.name}
                        </Link>
                        {child.children && child.children.length > 0 && child.children.map((grandchild: Category) => (
                          <Link
                            key={grandchild.id}
                            href={`/kategori/${grandchild.slug}`}
                            className="block pl-8 pr-4 py-2 text-xs text-neutral-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                          >
                            {grandchild.name}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile Search Bar */}
      {isSearchOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 border-t border-neutral-100 bg-white px-4 py-3 animate-slide-down shadow-md z-30">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Ürün ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="w-full pl-4 pr-12 py-2.5 bg-neutral-100 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-primary-400 transition-all"
              id="mobile-search-input"
            />
            <button
              onClick={handleSearch}
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-primary-600 text-white p-2 rounded-lg"
              aria-label="Ara"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div 
          className="lg:hidden absolute top-full left-0 right-0 bg-white overflow-y-auto animate-fade-in z-40 border-t border-neutral-100 shadow-xl"
          style={{ height: 'calc(100vh - 60px)', paddingBottom: '120px' }}
        >
          <div className="p-4 space-y-1">
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-3 py-2">
              Kategoriler
            </div>
            {categories.map((cat) => (
              <div key={cat.id}>
                <button
                  onClick={() =>
                    setActiveCategoryId(activeCategoryId === cat.id ? null : cat.id)
                  }
                  className="w-full flex items-center justify-between px-3 py-3 text-neutral-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <span className="font-medium">{cat.name}</span>
                  {cat.children && cat.children.length > 0 && (
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        activeCategoryId === cat.id ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </button>
                {cat.children &&
                  cat.children.length > 0 &&
                  activeCategoryId === cat.id && (
                    <div className="ml-4 border-l-2 border-primary-100 pl-3 space-y-0.5">
                      {cat.children.map((child) => (
                        <div key={child.id}>
                          <Link
                            href={`/kategori/${child.slug}`}
                            className="block px-3 py-2 text-sm text-neutral-500 hover:text-primary-600 rounded-md transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            {child.name}
                          </Link>
                          {child.children && child.children.map((grandchild: Category) => (
                            <Link
                              key={grandchild.id}
                              href={`/kategori/${grandchild.slug}`}
                              className="block px-3 py-2 pl-6 text-xs text-neutral-400 hover:text-primary-600 rounded-md transition-colors"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              {grandchild.name}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            ))}

            <div className="border-t border-neutral-100 my-3" />

            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-3 py-2">
              Kurumsal
            </div>
            <Link
              href="/hakkimizda"
              className="block px-3 py-3 text-neutral-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg font-medium transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Hakkımızda
            </Link>
            <Link
              href="/iletisim"
              className="block px-3 py-3 text-neutral-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg font-medium transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              İletişim
            </Link>
            <Link
              href="/bayilik-basvurusu"
              className="block px-3 py-3 text-neutral-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg font-medium transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Bayilik Başvurusu
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
