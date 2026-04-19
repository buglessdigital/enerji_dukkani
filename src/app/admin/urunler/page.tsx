'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Pencil, Trash2, Copy, Eye, EyeOff, Package, Filter, ImageIcon } from 'lucide-react'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'

function formatPrice(p: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(p)
}

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  async function fetchProducts() {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*, images:product_images(url, is_cover), category:categories(name)')
      .order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [])

  async function handleDelete(id: string) {
    await supabase.from('products').delete().eq('id', id)
    setDeleteId(null)
    fetchProducts()
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('products').update({ is_active: !current }).eq('id', id)
    fetchProducts()
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
    (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 font-heading">Ürün Yönetimi</h1>
          <p className="text-sm text-neutral-500 mt-1">{products.length} ürün</p>
        </div>
        <Link href="/admin/urunler/ekle" className="btn btn-primary">
          <Plus className="w-4 h-4" /> Yeni Ürün Ekle
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Ürün adı, SKU veya marka ile ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden w-full max-w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 text-neutral-600 text-xs uppercase tracking-wider">
                <th className="text-left py-3 px-4 font-semibold">Ürün</th>
                <th className="text-left py-3 px-4 font-semibold">Kategori</th>
                <th className="text-left py-3 px-4 font-semibold">Fiyat</th>
                <th className="text-left py-3 px-4 font-semibold">Stok</th>
                <th className="text-left py-3 px-4 font-semibold">Durum</th>
                <th className="text-left py-3 px-4 font-semibold">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}><td colSpan={6} className="py-4 px-4"><div className="h-10 skeleton rounded" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-neutral-400">
                    <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Ürün bulunamadı</p>
                  </td>
                </tr>
              ) : filtered.map(product => {
                const cover = product.images?.find((i: any) => i.is_cover) || product.images?.[0]
                return (
                  <tr key={product.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-neutral-100 rounded-lg overflow-hidden shrink-0 border border-neutral-200">
                          {cover?.url ? (
                            <img src={cover.url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-neutral-50">
                              <ImageIcon className="w-6 h-6 text-neutral-300" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-neutral-900 truncate max-w-[200px]">{product.name}</p>
                          <p className="text-xs text-neutral-400">{product.brand || '—'} {product.sku ? `• ${product.sku}` : ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-neutral-600">{product.category?.name || '—'}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-semibold text-neutral-900">{formatPrice(product.sale_price || product.price)}</p>
                        {product.sale_price && <p className="text-xs text-neutral-400 line-through">{formatPrice(product.price)}</p>}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        product.stock_quantity > 10 ? 'bg-green-100 text-green-700' :
                        product.stock_quantity > 0 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {product.stock_quantity} adet
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleActive(product.id, product.is_active)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                          product.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                        }`}
                      >
                        {product.is_active ? <><Eye className="w-3 h-3" /> Aktif</> : <><EyeOff className="w-3 h-3" /> Pasif</>}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/urunler/${product.id}`}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteId(product.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl animate-scale-in">
            <h3 className="text-lg font-bold text-neutral-900 mb-2">Ürünü Sil</h3>
            <p className="text-sm text-neutral-600 mb-6">Bu ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="btn btn-ghost">İptal</button>
              <button onClick={() => handleDelete(deleteId)} className="btn bg-red-600 hover:bg-red-700 text-white">Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
