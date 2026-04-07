'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Printer, Calendar, Hash, MapPin, Phone, Mail, FileText, Building2 } from 'lucide-react'

// Utility to format currency
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(price || 0)
}

// Utility to format date
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('tr-TR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function FaturaPage() {
  const { id } = useParams()
  const [order, setOrder] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      // Fetch Site Settings
      const { data: settingsData } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .single()

      if (settingsData) setSettings(settingsData)

      // Fetch Order Data
      const { data: orderData } = await supabase
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

      if (orderData) setOrder(orderData)
      setLoading(false)

      // Automatically trigger print dialog once loaded
      setTimeout(() => {
        window.print()
      }, 500)
    }

    if (id) {
      fetchData()
    }
  }, [id])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-medium">Fatura hazırlanıyor...</div>
  }

  if (!order) {
    return <div className="min-h-screen flex items-center justify-center font-medium text-red-500">Sipariş bulunamadı veya yetkiniz yok.</div>
  }

  const shipping = order.shipping_address
  const billing = order.billing_address || shipping

  // Calculatings
  const subtotal = order.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
  const taxRate = 0.20 // 20% default KDV
  const taxAmount = subtotal * taxRate
  const total = subtotal + taxAmount
  const orderTotal = order.total_amount // The saved total amount might include shipping

  return (
    <div className="min-h-screen bg-neutral-100 p-4 sm:p-8 print:bg-white print:p-0 font-body text-sm text-neutral-800">
      
      {/* Non-Printable Actions Bar */}
      <div className="max-w-[210mm] mx-auto mb-6 flex items-center justify-end gap-3 print:hidden">
        <button onClick={() => window.close()} className="px-4 py-2 bg-white border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 font-medium transition-colors">
          Kapat
        </button>
        <button onClick={() => window.print()} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center gap-2 transition-colors">
          <Printer className="w-4 h-4" /> Çıktı Al
        </button>
      </div>

      {/* A4 Printable Container */}
      <div className="max-w-[210mm] min-h-[297mm] mx-auto bg-white p-10 sm:p-14 shadow-lg print:shadow-none print:m-0 print:p-0">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-neutral-100 pb-8 mb-8">
          <div>
            <h1 className="text-3xl font-black font-heading tracking-tight mb-4">{settings?.site_name || 'Enerji Dükkanı'}</h1>
            
            <div className="space-y-1 text-sm text-neutral-500">
              {settings?.address && <p className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 shrink-0" /> {settings.address}</p>}
              {settings?.phone && <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> {settings.phone}</p>}
              {settings?.email && <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> {settings.email}</p>}
            </div>
          </div>
          <div className="mt-6 sm:mt-0 sm:text-right">
            <h2 className="text-4xl font-black text-neutral-200 font-heading tracking-widest uppercase mb-4">Fatura</h2>
            <div className="space-y-2">
              <div className="flex items-center sm:justify-end gap-2 text-neutral-900 font-bold">
                <Hash className="w-4 h-4 text-neutral-400" /> Sipariş No: {order.order_number}
              </div>
              <div className="flex items-center sm:justify-end gap-2 text-neutral-500">
                <Calendar className="w-4 h-4" /> {formatDate(order.created_at).split(' ')[0]}
              </div>
            </div>
          </div>
        </header>

        {/* Addresses */}
        <div className="grid grid-cols-2 gap-8 mb-10">
          <div>
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Fatura Adresi</h3>
            <div className="bg-neutral-50 p-4 rounded-xl space-y-1 text-sm">
              <p className="font-bold text-neutral-900 text-base mb-1">{billing?.full_name || order.user?.full_name}</p>
              {billing?.company_name && <p className="flex items-center gap-1.5 font-medium text-primary-700 mb-1"><Building2 className="w-3.5 h-3.5" /> {billing.company_name}</p>}
              <p className="text-neutral-600">{billing?.address}</p>
              <p className="text-neutral-600 font-medium">{billing?.city}, {billing?.country}</p>
              <div className="pt-2 mt-2 border-t border-neutral-200 w-full space-y-1">
                <p>T: {billing?.phone || order.user?.phone}</p>
                {(billing?.tax_number || billing?.tax_office) && (
                  <p className="font-medium text-neutral-700">Vergi: {billing.tax_office} / {billing.tax_number}</p>
                )}
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Teslimat Adresi</h3>
            <div className="p-4 rounded-xl space-y-1 text-sm border border-neutral-100">
              <p className="font-bold text-neutral-900 text-base mb-1">{shipping?.full_name || order.user?.full_name}</p>
              <p className="text-neutral-600">{shipping?.address}</p>
              <p className="text-neutral-600 font-medium">{shipping?.city}, {shipping?.country}</p>
              <p className="mt-2 pt-2 border-t border-neutral-100">T: {shipping?.phone || order.user?.phone}</p>
              
              <div className="mt-4 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <p className="text-xs text-neutral-500 uppercase font-bold mb-1">Ödeme Yöntemi</p>
                <p className="font-medium text-neutral-900">
                   {order.payment_method === 'credit_card' ? 'Kredi Kartı' : 
                    order.payment_method === 'bank_transfer' ? 'Havale / EFT' : 
                    order.payment_method}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Table */}
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2 border-neutral-900">
              <th className="py-3 text-left font-bold text-neutral-900">Ürün / Hizmet</th>
              <th className="py-3 text-center font-bold text-neutral-900 w-24">Adet</th>
              <th className="py-3 text-right font-bold text-neutral-900 w-32">Birim Fiyat</th>
              <th className="py-3 text-right font-bold text-neutral-900 w-32">Tutar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {order.items?.map((item: any, idx: number) => (
              <tr key={item.id || idx}>
                <td className="py-4 font-medium text-neutral-900">
                  {item.product_name}
                  {/* Variant info could go here if available */}
                </td>
                <td className="py-4 text-center font-medium">{item.quantity}</td>
                <td className="py-4 text-right">{formatPrice(item.price)}</td>
                <td className="py-4 text-right font-bold text-neutral-900">{formatPrice(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary */}
        <div className="flex justify-end mt-8">
          <div className="w-72 space-y-3">
            <div className="flex justify-between text-neutral-500 font-medium">
              <span>Ara Toplam</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-neutral-500 font-medium">
              <span>KDV (%20)</span>
              <span>{formatPrice(taxAmount)}</span>
            </div>
            {orderTotal > total && (
              <div className="flex justify-between text-neutral-500 font-medium">
                <span>Kargo & Diğer</span>
                <span>{formatPrice(orderTotal - total)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold border-t-2 border-neutral-900 pt-3 text-primary-600">
              <span>Genel Toplam</span>
              <span>{formatPrice(orderTotal)}</span>
            </div>
          </div>
        </div>

        {/* Footer Notes */}
        <div className="mt-20 pt-8 border-t border-neutral-200 text-sm text-neutral-400 text-center">
          <p className="font-medium text-neutral-500 mb-1">Bizi tercih ettiğiniz için teşekkür ederiz!</p>
          <p>Mali değeri yoktur, bilgilendirme amaçlı e-arşiv çıktısıdır.</p>
        </div>

      </div>
    </div>
  )
}
