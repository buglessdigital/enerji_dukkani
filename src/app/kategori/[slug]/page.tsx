import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import CategoryDetailClient from './CategoryDetailClient'

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params

  const { data: category } = await supabaseServer
    .from('categories')
    .select('name, description')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!category) {
    return { title: 'Kategori Bulunamadı' }
  }

  const title = `${category.name} | Enerji Dükkanı`
  const description = category.description || `${category.name} kategorisindeki tüm ürünleri Enerji Dükkanı'nda keşfedin.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  }
}

export default function CategoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return <CategoryDetailClient params={params} />
}
