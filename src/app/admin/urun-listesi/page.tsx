import { supabase } from '@/lib/supabase'
import ProductListClient from './ProductListClient'

export const dynamic = 'force-dynamic'

export default async function UrunListesiPage() {
  const [{ data: categories }, { data: settings }] = await Promise.all([
    supabase.from('categories').select('id, name, parent_id, slug').order('sort_order'),
    supabase.from('site_settings').select('id, usd_exchange_rate').limit(1).single(),
  ])

  const usdRate = Number(settings?.usd_exchange_rate ?? 0)

  return <ProductListClient categories={categories ?? []} usdRate={usdRate} />
}
