import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================================
// Data Fetching Helpers
// ============================================================

import type {
  Category,
  HeroSlide,
  Collection,
  Product,
  SiteSettings,
  StaticPage,
} from './types'

// --- Site Settings ---
export async function getSiteSettings(): Promise<SiteSettings | null> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .limit(1)
    .single()
  if (error) { console.error('getSiteSettings error:', error); return null }
  return data
}

// --- Categories ---
export async function getActiveCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (error) { console.error('getActiveCategories error:', error); return [] }

  // Build hierarchy
  const categories = data as Category[]
  const rootCategories = categories.filter(c => !c.parent_id)
  rootCategories.forEach(parent => {
    parent.children = categories.filter(c => c.parent_id === parent.id)
  })
  return rootCategories
}

// --- Hero Slides ---
export async function getActiveHeroSlides(): Promise<HeroSlide[]> {
  const { data, error } = await supabase
    .from('hero_slides')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (error) { console.error('getActiveHeroSlides error:', error); return [] }
  return data || []
}

// --- Collections ---
export async function getActiveCollections(): Promise<Collection[]> {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (error) { console.error('getActiveCollections error:', error); return [] }
  return data || []
}

// --- Featured Products ---
export async function getFeaturedProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      images:product_images(id, url, alt_text, sort_order, is_cover),
      category:categories(id, name, slug)
    `)
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(8)
  if (error) { console.error('getFeaturedProducts error:', error); return [] }
  return data || []
}

// --- Product by Slug ---
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      images:product_images(id, url, alt_text, sort_order, is_cover),
      variants:product_variants(id, name, value, price_modifier, stock_quantity, sort_order),
      category:categories(id, name, slug),
      reviews:reviews(id, rating, comment, status, admin_reply, created_at, user:profiles(full_name))
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  if (error) { console.error('getProductBySlug error:', error); return null }
  return data
}

// --- Product Rating ---
export async function getProductRating(productId: string): Promise<{ average: number; count: number }> {
  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('product_id', productId)
    .eq('status', 'approved')
  if (error || !data || data.length === 0) return { average: 0, count: 0 }
  const sum = data.reduce((acc, r) => acc + r.rating, 0)
  return { average: Math.round((sum / data.length) * 10) / 10, count: data.length }
}

// --- Static Page ---
export async function getStaticPage(slug: string): Promise<StaticPage | null> {
  const { data, error } = await supabase
    .from('static_pages')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error) { console.error('getStaticPage error:', error); return null }
  return data
}

// --- Related Products ---
export async function getRelatedProducts(categoryId: string, excludeProductId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      images:product_images(id, url, alt_text, sort_order, is_cover)
    `)
    .eq('is_active', true)
    .eq('category_id', categoryId)
    .neq('id', excludeProductId)
    .limit(4)
  if (error) { console.error('getRelatedProducts error:', error); return [] }
  return data || []
}
