'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Package, Truck, MapPin, CreditCard, ImageIcon, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { supabaseBrowser } from '@/lib/supabase-browser'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

function formatPrice(amount: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(amount)
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Onay Bekliyor',        color: 'bg-amber-100 text-amber-700 border-amber-200' },
  processing: { label: 'Hazırlanıyor',          color: 'bg-blue-100 text-blue-700 border-blue-200' },
  shipped:    { label: 'Kargoya Verildi',       color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  delivered:  { label: 'Teslim Edildi',         color: 'bg-green-100 text-green-700 border-green-200' },
  cancelled:  { label: 'İptal Edildi',          color: 'bg-red-100 text-red-700 border-red-200' },
}

const STEPS = ['pending', 'processing', 'shipped', 'delivered']

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabaseBrowser.auth.getSession()
      if (!session) { router.replace('/hesabim'); return }

      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .eq('user_id', session.user.id)
        .single()

      if (!orderData) { setNotFound(true); setLoading(false); return }
      setOrder(orderData)

      const { data: itemData } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', id)

      setItems(itemData || [])
      setLoading(false)
    }
    load()
  }, [id, router])

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="pt-[104px] lg:pt-[140px] bg-neutral-50 min-h-screen pb-20">
          <div className="container-custom max-w-3xl py-8 space-y-4">
            <div className="h-8 w-48 skeleton rounded" />
            <div className="h-64 skeleton rounded-3xl" />
            <div className="h-48 skeleton rounded-3xl" />
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (notFound) {
    return (
      <>
        <Navbar />
        <main className="pt-[104px] lg:pt-[140px] bg-neutral-50 min-h-screen pb-20 flex items-center justify-center">
          <div className="text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
            <h1 className="text-xl font-bold text-neutral-900 mb-2">Sipariş Bulunamadı</h1>
            <p className="text-neutral-500 mb-6">Bu siparişe erişim izniniz yok veya sipariş mevcut değil.</p>
            <Link href="/hesabim" className="btn btn-primary">Hesabıma Dön</Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const status = STATUS_MAP[order.status] || { label: order.status, color: 'bg-neutral-100 text-neutral-700 border-neutral-200' }
  const currentStep = STEPS.indexOf(order.status)
  const isCancelled = order.status === 'cancelled'
  const addr = order.shipping_address

  return (
    <>
      <Navbar />

      <main className="pt-[104px] lg:pt-[140px] bg-neutral-50 min-h-screen pb-20">
        <div className="container-custom max-w-3xl py-6">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-6">
            <Link href="/hesabim" className="hover:text-primary-600 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Hesabım
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-neutral-900 font-medium">Sipariş #{order.order_number}</span>
          </div>

          {/* Header */}
          <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-6 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-neutral-400 mb-1">{formatDate(order.created_at)}</p>
                <h1 className="text-xl font-bold font-heading text-neutral-900">Sipariş #{order.order_number}</h1>
              </div>
              <span className={`self-start sm:self-auto px-4 py-1.5 rounded-full text-sm font-bold border ${status.color}`}>
                {status.label}
              </span>
            </div>

            {/* Kargo Takip */}
            {order.tracking_number && (
              <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center gap-3 text-sm">
                <Truck className="w-4 h-4 text-primary-600 shrink-0" />
                <span className="text-neutral-600">
                  {order.shipping_company && <span className="font-semibold">{order.shipping_company} · </span>}
                  Takip No: <span className="font-mono font-bold text-neutral-900">{order.tracking_number}</span>
                </span>
              </div>
            )}
          </div>

          {/* Sipariş Adımları */}
          {!isCancelled && (
            <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-6 mb-4">
              <h2 className="text-sm font-bold text-neutral-700 mb-5">Sipariş Durumu</h2>
              <div className="flex items-center gap-0">
                {STEPS.map((step, i) => {
                  const done = currentStep >= i
                  const isLast = i === STEPS.length - 1
                  return (
                    <div key={step} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                          done ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-neutral-200 text-neutral-400'
                        }`}>
                          {i + 1}
                        </div>
                        <span className={`text-[10px] mt-1.5 font-medium text-center leading-tight max-w-[60px] ${done ? 'text-primary-700' : 'text-neutral-400'}`}>
                          {STATUS_MAP[step]?.label}
                        </span>
                      </div>
                      {!isLast && (
                        <div className={`flex-1 h-0.5 mx-1 mb-4 rounded-full ${currentStep > i ? 'bg-primary-600' : 'bg-neutral-200'}`} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Ürünler */}
          <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-6 mb-4">
            <h2 className="text-sm font-bold text-neutral-700 mb-4">Sipariş Ürünleri</h2>
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-neutral-100 overflow-hidden shrink-0 relative border border-neutral-100">
                    {item.product_image ? (
                      <Image src={item.product_image} alt={item.product_name} fill className="object-cover" sizes="64px" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-neutral-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-neutral-900 truncate">{item.product_name}</p>
                    {item.variant_info && Object.keys(item.variant_info).length > 0 && (
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {Object.entries(item.variant_info).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                      </p>
                    )}
                    {item.product_sku && <p className="text-xs text-neutral-400 mt-0.5">SKU: {item.product_sku}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-neutral-500">{item.quantity} adet × {formatPrice(item.unit_price)}</p>
                    <p className="font-bold text-sm text-neutral-900 mt-0.5">{formatPrice(item.total_price)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Tutar Özeti */}
            <div className="mt-6 pt-5 border-t border-neutral-100 space-y-2">
              <div className="flex justify-between text-sm text-neutral-600">
                <span>Ara Toplam</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.shipping_cost > 0 && (
                <div className="flex justify-between text-sm text-neutral-600">
                  <span>Kargo</span>
                  <span>{formatPrice(order.shipping_cost)}</span>
                </div>
              )}
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>İndirim</span>
                  <span>-{formatPrice(order.discount_amount)}</span>
                </div>
              )}
              {order.tax_amount > 0 && (
                <div className="flex justify-between text-sm text-neutral-600">
                  <span>KDV</span>
                  <span>{formatPrice(order.tax_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-neutral-900 pt-3 border-t border-neutral-100">
                <span>Toplam</span>
                <span className="text-primary-700">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Adres + Ödeme */}
          <div className="grid sm:grid-cols-2 gap-4 mb-4">

            {/* Teslimat Adresi */}
            {addr && (
              <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-4 h-4 text-primary-600" />
                  <h2 className="text-sm font-bold text-neutral-700">Teslimat Adresi</h2>
                </div>
                <p className="font-semibold text-sm text-neutral-900">{addr.full_name}</p>
                <p className="text-sm text-neutral-500 mt-1">{addr.phone}</p>
                <p className="text-sm text-neutral-600 mt-2 leading-relaxed">{addr.address_line}</p>
                <p className="text-sm text-neutral-600">{addr.district} / {addr.city}</p>
                {addr.zip_code && <p className="text-xs text-neutral-400 mt-1">{addr.zip_code}</p>}
              </div>
            )}

            {/* Ödeme Bilgisi */}
            <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-4 h-4 text-primary-600" />
                <h2 className="text-sm font-bold text-neutral-700">Ödeme Bilgisi</h2>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Ödeme Yöntemi</span>
                  <span className="font-semibold text-neutral-900 capitalize">{order.payment_method || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Ödeme Durumu</span>
                  <span className={`font-semibold ${order.payment_status === 'paid' ? 'text-green-600' : order.payment_status === 'refunded' ? 'text-blue-600' : 'text-amber-600'}`}>
                    {order.payment_status === 'paid' ? 'Ödendi' :
                     order.payment_status === 'pending' ? 'Bekliyor' :
                     order.payment_status === 'failed' ? 'Başarısız' :
                     order.payment_status === 'refunded' ? 'İade Edildi' : order.payment_status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Müşteri Notu */}
          {order.customer_note && (
            <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-6">
              <h2 className="text-sm font-bold text-neutral-700 mb-2">Sipariş Notunuz</h2>
              <p className="text-sm text-neutral-600 leading-relaxed">{order.customer_note}</p>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </>
  )
}
