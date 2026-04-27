'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Search, Plus, Trash2, Send, Eye, FileText, User,
  Phone, Mail, Calendar, MessageSquare, Package, ChevronRight,
  CheckCircle, X, Hash, ExternalLink,
} from 'lucide-react'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'
import type { QuoteItem } from '@/lib/types'

function formatPrice(p: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(p)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('tr-TR')
}

interface ProductResult {
  id: string
  name: string
  sku: string | null
  price: number
  sale_price: number | null
  images: { url: string; is_cover: boolean }[]
}

interface SavedQuote {
  id: string
  quote_number: string
  customer_name: string
  customer_phone: string
  total: number
  status: string
  created_at: string
}

const statusColors: Record<string, string> = {
  draft: 'bg-neutral-100 text-neutral-600',
  sent: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  expired: 'bg-amber-100 text-amber-700',
}
const statusLabels: Record<string, string> = {
  draft: 'Taslak',
  sent: 'Gönderildi',
  accepted: 'Kabul Edildi',
  rejected: 'Reddedildi',
  expired: 'Süresi Doldu',
}

export default function AdminTeklifPage() {
  // --- Product search ---
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<ProductResult[]>([])
  const [searching, setSearching] = useState(false)

  // --- Quote items ---
  const [items, setItems] = useState<QuoteItem[]>([])

  // --- Customer info ---
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [note, setNote] = useState('')
  const [taxRate, setTaxRate] = useState(20)

  // --- UI state ---
  const [saving, setSaving] = useState(false)
  const [savedQuote, setSavedQuote] = useState<{ id: string; quote_number: string } | null>(null)
  const [quotes, setQuotes] = useState<SavedQuote[]>([])
  const [loadingQuotes, setLoadingQuotes] = useState(true)
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [siteUrl, setSiteUrl] = useState('')

  // Load existing quotes and site settings
  useEffect(() => {
    async function load() {
      const [quotesRes, settingsRes] = await Promise.all([
        supabase
          .from('quotes')
          .select('id, quote_number, customer_name, customer_phone, total, status, created_at')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase.from('site_settings').select('whatsapp_number').limit(1).single(),
      ])
      setQuotes((quotesRes.data as SavedQuote[]) || [])
      setWhatsappNumber(settingsRes.data?.whatsapp_number || '')
      setSiteUrl(window.location.origin)
      setLoadingQuotes(false)
    }
    load()
  }, [])

  // Product search
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return }
    setSearching(true)
    const { data } = await supabase
      .from('products')
      .select('id, name, sku, price, sale_price, images:product_images(url, is_cover)')
      .eq('is_active', true)
      .ilike('name', `%${q}%`)
      .limit(8)
    setSearchResults((data as ProductResult[]) || [])
    setSearching(false)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => doSearch(search), 300)
    return () => clearTimeout(t)
  }, [search, doSearch])

  function addProduct(p: ProductResult) {
    if (items.find(i => i.product_id === p.id)) return
    const cover = p.images?.find(img => img.is_cover)?.url || p.images?.[0]?.url || null
    const price = p.sale_price ?? p.price
    setItems(prev => [...prev, {
      product_id: p.id,
      product_name: p.name,
      product_sku: p.sku,
      image_url: cover,
      quantity: 1,
      unit_price: price,
      total_price: price,
    }])
    setSearch('')
    setSearchResults([])
  }

  function removeItem(productId: string) {
    setItems(prev => prev.filter(i => i.product_id !== productId))
  }

  function updateQty(productId: string, qty: number) {
    setItems(prev => prev.map(i =>
      i.product_id === productId
        ? { ...i, quantity: qty, total_price: i.unit_price * qty }
        : i
    ))
  }

  function updatePrice(productId: string, price: number) {
    setItems(prev => prev.map(i =>
      i.product_id === productId
        ? { ...i, unit_price: price, total_price: price * i.quantity }
        : i
    ))
  }

  // Totals
  const subtotal = items.reduce((s, i) => s + i.total_price, 0)
  const taxAmount = (subtotal * taxRate) / 100
  const total = subtotal + taxAmount

  async function saveQuote() {
    if (!customerName || !customerPhone || items.length === 0) return
    setSaving(true)
    const { data, error } = await supabase
      .from('quotes')
      .insert({
        quote_number: '',
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || null,
        valid_until: validUntil || null,
        note: note || null,
        items,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
        status: 'sent',
      })
      .select('id, quote_number')
      .single()

    if (!error && data) {
      setSavedQuote(data)
      // Reload list
      const { data: list } = await supabase
        .from('quotes')
        .select('id, quote_number, customer_name, customer_phone, total, status, created_at')
        .order('created_at', { ascending: false })
        .limit(20)
      setQuotes((list as SavedQuote[]) || [])
    }
    setSaving(false)
  }

  function buildWhatsAppUrl(quoteId: string, quoteNumber: string) {
    const clean = customerPhone.replace(/\s/g, '').replace(/^\+/, '').replace(/^0/, '90')

    const quoteUrl = `${siteUrl}/teklif/${quoteId}`
    const text = encodeURIComponent(
      `Sayın ${customerName},\n\nEnerji Ambarı olarak tarafınıza özel hazırladığımız teklifi aşağıdaki linkten inceleyebilirsiniz:\n\n📄 ${quoteNumber}\n🔗 ${quoteUrl}\n\nHerhangi bir sorunuz olursa bize ulaşabilirsiniz. İyi günler dileriz.`
    )
    return `https://wa.me/${clean}?text=${text}`
  }

  function resetForm() {
    setItems([])
    setCustomerName('')
    setCustomerPhone('')
    setCustomerEmail('')
    setValidUntil('')
    setNote('')
    setSavedQuote(null)
  }

  async function deleteQuote(id: string) {
    await supabase.from('quotes').delete().eq('id', id)
    setQuotes(prev => prev.filter(q => q.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 font-heading">Teklif Oluştur</h1>
          <p className="text-sm text-neutral-500 mt-1">Ürün seçin, fiyatlandırın ve WhatsApp ile gönderin</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT: Builder */}
        <div className="xl:col-span-2 space-y-5">

          {/* Customer Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
            <h2 className="text-base font-bold text-neutral-800 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-primary-600" /> Müşteri Bilgileri
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1.5">Ad Soyad *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Ahmet Yılmaz"
                    className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1.5">WhatsApp Numarası *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="05XX XXX XX XX"
                    className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1.5">E-posta</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    placeholder="ornek@mail.com"
                    className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1.5">Geçerlilik Tarihi</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="date"
                    value={validUntil}
                    onChange={e => setValidUntil(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-neutral-500 mb-1.5">Not</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    rows={2}
                    placeholder="Müşteriye iletmek istediğiniz özel notlar..."
                    className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Product Search */}
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
            <h2 className="text-base font-bold text-neutral-800 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-primary-600" /> Ürün Ekle
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Ürün adı ile ara..."
                className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
                {searchResults.map(p => {
                  const cover = p.images?.find(img => img.is_cover)?.url || p.images?.[0]?.url
                  const alreadyAdded = items.some(i => i.product_id === p.id)
                  return (
                    <button
                      key={p.id}
                      onClick={() => addProduct(p)}
                      disabled={alreadyAdded}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors text-left border-b border-neutral-100 last:border-b-0 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <div className="w-10 h-10 bg-neutral-100 rounded-lg overflow-hidden shrink-0">
                        {cover ? (
                          <img src={cover} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-neutral-400 m-auto mt-2.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-800 truncate">{p.name}</p>
                        {p.sku && <p className="text-xs text-neutral-400">{p.sku}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-neutral-900">{formatPrice(p.sale_price ?? p.price)}</p>
                        {alreadyAdded && <p className="text-xs text-green-600">Eklendi</p>}
                      </div>
                      {!alreadyAdded && <Plus className="w-4 h-4 text-primary-500 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Items Table */}
          {items.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
              <div className="p-5 border-b border-neutral-100">
                <h2 className="text-base font-bold text-neutral-800">Teklif Kalemleri</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider">
                      <th className="text-left py-3 px-5 font-semibold">Ürün</th>
                      <th className="text-center py-3 px-3 font-semibold w-24">Adet</th>
                      <th className="text-right py-3 px-3 font-semibold w-36">Birim Fiyat</th>
                      <th className="text-right py-3 px-5 font-semibold w-32">Toplam</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {items.map(item => (
                      <tr key={item.product_id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-neutral-100 rounded-lg overflow-hidden shrink-0">
                              {item.image_url ? (
                                <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-5 h-5 text-neutral-400 m-auto mt-2.5" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-neutral-800 leading-tight">{item.product_name}</p>
                              {item.product_sku && <p className="text-xs text-neutral-400">{item.product_sku}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-3 text-center">
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={e => updateQty(item.product_id, Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-16 text-center border border-neutral-200 rounded-lg py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                          />
                        </td>
                        <td className="py-4 px-3 text-right">
                          <div className="relative inline-flex items-center">
                            <span className="absolute left-2 text-neutral-400 text-xs">₺</span>
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              value={item.unit_price}
                              onChange={e => updatePrice(item.product_id, parseFloat(e.target.value) || 0)}
                              className="w-28 text-right pl-5 pr-2 border border-neutral-200 rounded-lg py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                            />
                          </div>
                        </td>
                        <td className="py-4 px-5 text-right font-semibold text-neutral-900">
                          {formatPrice(item.total_price)}
                        </td>
                        <td className="py-4 pr-3">
                          <button
                            onClick={() => removeItem(item.product_id)}
                            className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Summary + Actions */}
        <div className="space-y-5">

          {/* Price Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 sticky top-24">
            <h2 className="text-base font-bold text-neutral-800 mb-4">Teklif Özeti</h2>

            {items.length === 0 ? (
              <div className="text-center py-8 text-neutral-400">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Henüz ürün eklenmedi</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-neutral-600">
                    <span>Ara Toplam</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-neutral-600">
                    <div className="flex items-center gap-2">
                      <span>KDV</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={taxRate}
                        onChange={e => setTaxRate(parseInt(e.target.value) || 0)}
                        className="w-12 text-center border border-neutral-200 rounded-lg py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-400"
                      />
                      <span className="text-xs">%</span>
                    </div>
                    <span className="font-medium">{formatPrice(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-900 font-bold text-base pt-2 border-t border-neutral-100">
                    <span>Genel Toplam</span>
                    <span className="text-primary-600">{formatPrice(total)}</span>
                  </div>
                </div>

                <div className="mt-4 text-xs text-neutral-400 flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  <span>{items.length} kalem, toplam {items.reduce((s, i) => s + i.quantity, 0)} adet</span>
                </div>
              </>
            )}

            {/* Success state */}
            {savedQuote ? (
              <div className="mt-5 space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">Teklif Kaydedildi</p>
                    <p className="text-xs text-green-600 mt-0.5">{savedQuote.quote_number}</p>
                  </div>
                </div>
                <a
                  href={buildWhatsAppUrl(savedQuote.id, savedQuote.quote_number)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm text-white transition-all"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="w-4 h-4 fill-white">
                    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                  </svg>
                  WhatsApp ile Gönder
                </a>
                <Link
                  href={`/teklif/${savedQuote.id}`}
                  target="_blank"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Teklifi Görüntüle
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={resetForm}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Yeni Teklif Oluştur
                </button>
              </div>
            ) : (
              <button
                onClick={saveQuote}
                disabled={saving || items.length === 0 || !customerName || !customerPhone}
                className="mt-5 w-full flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-colors"
              >
                {saving ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Kaydediliyor...</>
                ) : (
                  <><Send className="w-4 h-4" /> Teklifi Kaydet & Gönder</>
                )}
              </button>
            )}

            {!savedQuote && (customerName === '' || customerPhone === '') && items.length > 0 && (
              <p className="mt-2 text-xs text-center text-amber-600">Müşteri adı ve telefon zorunludur</p>
            )}
          </div>
        </div>
      </div>

      {/* Previous Quotes */}
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-neutral-800">Önceki Teklifler</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider">
                <th className="text-left py-3 px-5 font-semibold">Teklif No</th>
                <th className="text-left py-3 px-4 font-semibold">Müşteri</th>
                <th className="text-left py-3 px-4 font-semibold">Telefon</th>
                <th className="text-right py-3 px-4 font-semibold">Tutar</th>
                <th className="text-center py-3 px-4 font-semibold">Durum</th>
                <th className="text-left py-3 px-4 font-semibold">Tarih</th>
                <th className="text-right py-3 px-5 font-semibold">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loadingQuotes ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="py-4 px-4"><div className="h-4 skeleton rounded w-24" /></td>
                    ))}
                  </tr>
                ))
              ) : quotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>Henüz teklif oluşturulmadı</p>
                  </td>
                </tr>
              ) : (
                quotes.map(q => (
                  <tr key={q.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-4 px-5 font-mono font-semibold text-neutral-800">{q.quote_number}</td>
                    <td className="py-4 px-4 font-medium text-neutral-800">{q.customer_name}</td>
                    <td className="py-4 px-4 text-neutral-500">{q.customer_phone}</td>
                    <td className="py-4 px-4 text-right font-semibold text-neutral-900">{formatPrice(q.total)}</td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[q.status] || 'bg-neutral-100 text-neutral-600'}`}>
                        {statusLabels[q.status] || q.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-neutral-500 text-xs">{formatDate(q.created_at)}</td>
                    <td className="py-4 px-5">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/teklif/${q.id}`}
                          target="_blank"
                          className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Görüntüle"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => deleteQuote(q.id)}
                          className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
