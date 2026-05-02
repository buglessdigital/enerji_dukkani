import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import ProductDetailClient from './ProductDetailClient'

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params

  const { data: product } = await supabaseServer
    .from('products')
    .select('name, short_description, brand, images:product_images(url, is_cover, alt_text)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!product) {
    return { title: 'Ürün Bulunamadı' }
  }

  const coverImg = (product.images as any[])?.find((i: any) => i.is_cover) || (product.images as any[])?.[0]
  const title = product.brand ? `${product.name} | ${product.brand}` : product.name
  const description = product.short_description || `${product.name} ürününü Enerji Dükkanı'nda keşfedin.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: coverImg?.url ? [{ url: coverImg.url, alt: coverImg.alt_text || product.name }] : [],
    },
  }
}

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return <ProductDetailClient params={params} />
}
