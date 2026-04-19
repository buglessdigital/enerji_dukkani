'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, MapPin, Phone, Mail, Package, FileText, Loader2, CheckCircle2, ChevronDown, ImageIcon, Printer } from 'lucide-react'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'

function formatPrice(p: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(p)
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-violet-100 text-violet-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const statusLabels: Record<string, string> = {
  pending: 'Onay Bekliyor',
  processing: 'Hazırlanıyor',
  shipped: 'Kargoda',
  delivered: 'Tamamlandı',
  cancelled: 'İptal Edildi',
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    status: '',
    payment_status: '',
    tracking_number: '',
    shipping_company: '',
    admin_note: ''
  })

  useEffect(() => {
    async function fetchOrder() {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          user:profiles(*),
          items:order_items(*),
          shipping_address:addresses!orders_shipping_address_id_fkey(*),
          billing_address:addresses!orders_billing_address_id_fkey(*)
        `)
        .eq('id', id)
        .single()
      
      if (error) {
        console.error("Order fetch error:", error)
      }

      if (data) {
        setOrder(data)
        setForm({
          status: data.status,
          payment_status: data.payment_status,
          tracking_number: data.tracking_number || '',
          shipping_company: data.shipping_company || '',
          admin_note: data.admin_note || ''
        })
      }
      setLoading(false)
    }
    fetchOrder()
  }, [id])

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSuccess('')

    const { error } = await supabase
      .from('orders')
      .update({
        status: form.status,
        payment_status: form.payment_status,
        tracking_number: form.tracking_number || null,
        shipping_company: form.shipping_company || null,
        admin_note: form.admin_note || null,
      })
      .eq('id', id)

    if (!error) {
      setSuccess('Sipariş başarıyla güncellendi.')
      // Update local state
      setOrder((prev: any) => ({ ...prev, ...form }))
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="h-8 w-48 skeleton rounded" />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6"><div className="h-64 skeleton rounded-2xl" /><div className="h-96 skeleton rounded-2xl" /></div>
        <div className="space-y-6"><div className="h-80 skeleton rounded-2xl" /></div>
      </div>
    </div>
  )

  if (!order) return <div className="p-8 text-center text-neutral-500">Sipariş bulunamadı.</div>

  const shipping = order.shipping_address
  const billing = order.billing_address || shipping

  return (
    <div className="max-w-5xl mx-auto space-y-6">
       {/* Header */}
       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/siparisler" className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-neutral-900 font-heading">Sipariş #{order.order_number}</h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColors[order.status]}`}>
                {statusLabels[order.status]}
              </span>
            </div>
            <p className="text-sm text-neutral-500 mt-1">{formatDate(order.created_at)}</p>
          </div>
        </div>
        

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link href={`/fatura/${order.id}`} target="_blank" className="btn btn-outline bg-white w-full sm:w-auto">
            <Printer className="w-4 h-4" /> Yazdır
          </Link>
          <button form="update-form" type="submit" disabled={saving} className="btn btn-primary w-full sm:w-auto">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor...</> : <><Save className="w-4 h-4" /> Değişiklikleri Kaydet</>}
          </button>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-5 h-5" /> {success}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Items & Customer */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Order Items */}
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
            <div className="p-5 flex items-center gap-2 border-b border-neutral-100 bg-neutral-50/50">
              <Package className="w-5 h-5 text-neutral-400" />
              <h2 className="font-bold text-neutral-900">Sipariş İçeriği</h2>
              <span className="ml-auto text-sm text-neutral-500">{order.items?.length || 0} ürün</span>
            </div>
            <div className="p-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-neutral-500 border-b border-neutral-100">
                    <th className="pb-3 font-medium">Ürün</th>
                    <th className="pb-3 font-medium text-center">Adet</th>
                    <th className="pb-3 font-medium text-right">Birim</th>
                    <th className="pb-3 font-medium text-right">Toplam</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {order.items?.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-neutral-100 rounded-lg overflow-hidden shrink-0 border border-neutral-200">
                            {item.product_image ? (
                              <img src={item.product_image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-neutral-50"><ImageIcon className="w-6 h-6 text-neutral-300" /></div>
                            )}
                          </div>
                          <div>
                            <Link href={`/urun/${item.product_id}`} target="_blank" className="font-semibold text-neutral-900 hover:text-primary-600 line-clamp-2">
                              {item.product_name}
                            </Link>
                            {item.variant_info && <p className="text-xs text-neutral-500 mt-0.5">{item.variant_info}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-center font-medium text-neutral-700">{item.quantity}</td>
                      <td className="py-4 text-right text-neutral-600">{formatPrice(item.unit_price)}</td>
                      <td className="py-4 text-right font-bold text-neutral-900">{formatPrice(item.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="mt-6 pt-6 border-t border-neutral-100 max-w-sm ml-auto space-y-3">
                <div className="flex justify-between text-sm text-neutral-600">
                  <span>Ara Toplam</span>
                  <span className="font-medium text-neutral-900">{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-neutral-600">
                  <span>Kargo</span>
                  <span className="font-medium text-neutral-900">{order.shipping_cost === 0 ? 'Ücretsiz' : formatPrice(order.shipping_cost)}</span>
                </div>
                <div className="flex justify-between text-sm text-neutral-600">
                  <span>KDV (%20)</span>
                  <span className="font-medium text-neutral-900">{formatPrice(order.tax_amount)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-neutral-100">
                  <span className="font-bold text-neutral-900">Genel Toplam</span>
                  <span className="font-heading font-extrabold text-primary-700 text-lg">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Addresses */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
              <div className="p-5 border-b border-neutral-100 bg-neutral-50/50">
                <h2 className="font-bold text-neutral-900">Müşteri & Teslimat</h2>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-xs font-semibold uppercase text-neutral-400 mb-2">MÜŞTERİ BİLGİLERİ</h3>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-lg">
                      {order.user?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-bold text-neutral-900">{order.user?.full_name || 'Silinmiş Kullanıcı'}</p>
                      <p className="text-sm text-neutral-500">{order.user?.role === 'dealer' ? 'Bayi' : 'Bireysel Müşteri'}</p>
                    </div>
                  </div>
                  <div className="space-y-1 mt-3">
                    {order.user?.email && <a href={`mailto:${order.user.email}`} className="flex items-center gap-2 text-sm text-neutral-600 hover:text-primary-600"><Mail className="w-4 h-4" /> {order.user.email}</a>}
                    {shipping?.phone && <a href={`tel:${shipping.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 text-sm text-neutral-600 hover:text-primary-600"><Phone className="w-4 h-4" /> {shipping.phone}</a>}
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-100">
                  <h3 className="text-xs font-semibold uppercase text-neutral-400 mb-2 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> TESLİMAT ADRESİ</h3>
                  {shipping ? (
                    <div className="text-sm text-neutral-700 bg-neutral-50 p-3 rounded-lg">
                      <p className="font-bold mb-1">{shipping.full_name}</p>
                      <p className="whitespace-pre-line leading-relaxed mb-2">{shipping.address_line}</p>
                      <p className="font-medium text-neutral-900">{shipping.district} / {shipping.city}</p>
                      {shipping.zip_code && <p className="text-neutral-500 text-xs mt-1">{shipping.zip_code}</p>}
                    </div>
                  ) : <p className="text-sm text-neutral-500 italic">Adres bilgisi bulunamadı.</p>}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
              <div className="p-5 border-b border-neutral-100 bg-neutral-50/50 flex justify-between items-center">
                <h2 className="font-bold text-neutral-900">Fatura Adresi</h2>
                <span className="text-xs font-medium text-neutral-500 bg-white px-2 py-1 rounded border border-neutral-200">
                  {order.billing_address_id === order.shipping_address_id ? 'Teslimat ile aynı' : 'Farklı Adres'}
                </span>
              </div>
              <div className="p-5 space-y-4">
                  {billing ? (
                    <div className="text-sm text-neutral-700 bg-neutral-50 p-3 rounded-lg h-full">
                      <p className="font-bold mb-1">{billing.full_name}</p>
                      <p className="whitespace-pre-line leading-relaxed mb-2">{billing.address_line}</p>
                      <p className="font-medium text-neutral-900">{billing.district} / {billing.city}</p>
                      {billing.zip_code && <p className="text-neutral-500 text-xs mt-1">{billing.zip_code}</p>}
                    </div>
                  ) : <p className="text-sm text-neutral-500 italic">Adres bilgisi bulunamadı.</p>}
              </div>

              {/* Customer Note */}
              {order.customer_note && (
                <div className="mx-5 mb-5 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <h3 className="text-xs font-bold text-amber-800 uppercase mb-1 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Müşteri Notu</h3>
                  <p className="text-sm text-amber-900 italic">&quot;{order.customer_note}&quot;</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Order Actions */}
        <div className="lg:col-span-1 space-y-6">
          <form id="update-form" onSubmit={handleUpdate} className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden sticky top-24">
            <div className="p-5 border-b border-neutral-100 bg-neutral-50/50">
              <h2 className="font-bold text-neutral-900">Durum Güncelleme</h2>
            </div>
            
            <div className="p-5 space-y-5">
              
              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-neutral-700">Sipariş Durumu</label>
                <div className="relative">
                  <select 
                    value={form.status}
                    onChange={e => setForm({...form, status: e.target.value})}
                    className={`w-full appearance-none px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-colors cursor-pointer outline-none focus:ring-0
                      ${form.status === 'pending' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                        form.status === 'processing' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                        form.status === 'shipped' ? 'bg-violet-50 border-violet-200 text-violet-800' :
                        form.status === 'delivered' ? 'bg-green-50 border-green-200 text-green-800' :
                        'bg-red-50 border-red-200 text-red-800'
                      }
                    `}
                  >
                    <option value="pending">Onay Bekliyor</option>
                    <option value="processing">Hazırlanıyor</option>
                    <option value="shipped">Kargoda</option>
                    <option value="delivered">Teslim Edildi (Tamamlandı)</option>
                    <option value="cancelled">İptal Edildi</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none opacity-50" />
                </div>
              </div>

              {/* Payment Status */}
              <div className="space-y-1.5 pt-3 border-t border-neutral-100">
                <label className="text-sm font-bold text-neutral-700 flex justify-between">
                  Ödeme Durumu
                  <span className="text-xs font-normal text-neutral-400 capitalize">Yöntem: {order.payment_method}</span>
                </label>
                <select 
                    value={form.payment_status}
                    onChange={e => setForm({...form, payment_status: e.target.value})}
                    className="w-full appearance-none px-4 py-2.5 rounded-xl border-2 border-neutral-200 bg-white text-sm font-semibold focus:border-primary-500 focus:outline-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right .75rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
                  >
                    <option value="pending">Ödeme Bekliyor</option>
                    <option value="paid">Ödendi</option>
                    <option value="failed">Başarısız</option>
                    <option value="refunded">İade Edildi</option>
                  </select>
              </div>

              {/* Shipping Details */}
              <div className="space-y-4 pt-3 border-t border-neutral-100">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-neutral-700">Kargo Firması</label>
                  <input type="text" value={form.shipping_company} onChange={e => setForm({...form, shipping_company: e.target.value})} className="input text-sm bg-neutral-50" placeholder="Örn: Yurtiçi Kargo" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-neutral-700">Kargo Takip No</label>
                  <input type="text" value={form.tracking_number} onChange={e => setForm({...form, tracking_number: e.target.value})} className="input text-sm bg-neutral-50" placeholder="Müşteriye de görünür" />
                </div>
              </div>

              {/* Admin Note */}
              <div className="space-y-1.5 pt-3 border-t border-neutral-100">
                <label className="text-sm font-bold text-neutral-700">Not / Özel Durum (Admin)</label>
                <textarea 
                  value={form.admin_note} 
                  onChange={e => setForm({...form, admin_note: e.target.value})} 
                  rows={3} 
                  className="input resize-y text-sm bg-neutral-50" 
                  placeholder="Müşteri görmez, sadece yöneticiler içindir." 
                />
              </div>

            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
