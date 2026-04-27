import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'
import { Package, Phone, Mail, Calendar, CheckCircle, Clock, FileText } from 'lucide-react'
import type { Quote } from '@/lib/types'
import PrintButton from './PrintButton'
import QuoteBuyButton from './QuoteBuyButton'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function formatPrice(p: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(p)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Taslak', color: 'bg-neutral-100 text-neutral-600', icon: FileText },
  sent: { label: 'Gönderildi', color: 'bg-blue-100 text-blue-700', icon: Clock },
  accepted: { label: 'Kabul Edildi', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: 'Reddedildi', color: 'bg-red-100 text-red-700', icon: FileText },
  expired: { label: 'Süresi Doldu', color: 'bg-amber-100 text-amber-700', icon: Clock },
}

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient(supabaseUrl, supabaseKey)

  const [{ data: quote, error }, { data: settings }] = await Promise.all([
    supabase.from('quotes').select('*').eq('id', id).single(),
    supabase.from('site_settings').select('site_name,company_name,phone,email,address,whatsapp_number').single(),
  ])

  if (error || !quote) notFound()

  const q = quote as Quote
  const status = statusConfig[q.status] || statusConfig.sent
  const StatusIcon = status.icon
  const siteName = settings?.site_name || 'Enerji Ambarı'
  const companyName = settings?.company_name || 'Enerji Ambarı Enerji Sistemleri'
  const companyPhone = settings?.phone || settings?.whatsapp_number || ''
  const companyEmail = settings?.email || ''
  const companyAddress = settings?.address || ''

  return (
    <div className="min-h-screen bg-neutral-50 py-8 px-4">
      {/* Print button */}
      <div className="max-w-3xl mx-auto mb-4 flex justify-end print:hidden">
        <PrintButton />
      </div>

      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden print:shadow-none print:border-none">

        {/* Header */}
        <div className="bg-gradient-to-br from-primary-700 to-primary-900 px-8 py-7 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6 text-accent-400">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span className="font-bold text-lg tracking-tight">{siteName}</span>
              </div>
              <p className="text-primary-200 text-sm">{companyName}</p>
            </div>
            <div className="text-right">
              <p className="text-primary-300 text-xs uppercase tracking-widest mb-1">Teklif No</p>
              <p className="font-mono font-bold text-xl">{q.quote_number}</p>
              <p className="text-primary-200 text-sm mt-1">{formatDate(q.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Status + Validity */}
        <div className="px-8 py-4 border-b border-neutral-100 flex items-center justify-between flex-wrap gap-3 bg-neutral-50/60">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${status.color}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {status.label}
          </span>
          {q.valid_until && (
            <div className="flex items-center gap-1.5 text-sm text-neutral-500">
              <Calendar className="w-4 h-4" />
              <span>Geçerlilik: <span className="font-semibold text-neutral-700">{formatDate(q.valid_until)}</span></span>
            </div>
          )}
        </div>

        {/* Customer Info */}
        <div className="px-8 py-6 border-b border-neutral-100">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Teklif Sahibi</p>
          <p className="text-lg font-bold text-neutral-900">{q.customer_name}</p>
          <div className="mt-2 flex flex-wrap gap-4">
            {q.customer_phone && (
              <a href={`tel:${q.customer_phone}`} className="flex items-center gap-1.5 text-sm text-neutral-600 hover:text-primary-600 transition-colors">
                <Phone className="w-4 h-4" />
                {q.customer_phone}
              </a>
            )}
            {q.customer_email && (
              <a href={`mailto:${q.customer_email}`} className="flex items-center gap-1.5 text-sm text-neutral-600 hover:text-primary-600 transition-colors">
                <Mail className="w-4 h-4" />
                {q.customer_email}
              </a>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="px-8 py-6">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">Teklif Kalemleri</p>
          <div className="space-y-3">
            {q.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100"
              >
                <div className="w-12 h-12 bg-white rounded-lg border border-neutral-200 overflow-hidden shrink-0 flex items-center justify-center relative">
                  {item.image_url ? (
                    <Image src={item.image_url} alt={item.product_name} fill className="object-cover" sizes="48px" />
                  ) : (
                    <Package className="w-5 h-5 text-neutral-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-800 text-sm leading-snug">{item.product_name}</p>
                  {item.product_sku && <p className="text-xs text-neutral-400 mt-0.5">SKU: {item.product_sku}</p>}
                </div>
                <div className="text-center shrink-0 w-16">
                  <p className="text-xs text-neutral-400">Adet</p>
                  <p className="font-bold text-neutral-800">{item.quantity}</p>
                </div>
                <div className="text-right shrink-0 w-28">
                  <p className="text-xs text-neutral-400">Birim</p>
                  <p className="text-sm text-neutral-600">{formatPrice(item.unit_price)}</p>
                </div>
                <div className="text-right shrink-0 w-28">
                  <p className="text-xs text-neutral-400">Toplam</p>
                  <p className="font-bold text-neutral-900">{formatPrice(item.total_price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="px-8 pb-6">
          <div className="bg-neutral-50 rounded-xl border border-neutral-100 p-5 ml-auto max-w-xs space-y-3">
            <div className="flex justify-between text-sm text-neutral-600">
              <span>Ara Toplam</span>
              <span className="font-medium">{formatPrice(q.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-neutral-600">
              <span>KDV (%{q.tax_rate})</span>
              <span className="font-medium">{formatPrice(q.tax_amount)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-neutral-900 pt-2 border-t border-neutral-200">
              <span>Genel Toplam</span>
              <span className="text-primary-600 text-lg">{formatPrice(q.total)}</span>
            </div>
          </div>
        </div>

        {/* Buy CTA */}
        {q.status !== 'rejected' && q.status !== 'expired' && (
          <div className="px-8 pb-6 print:hidden">
            <div className="bg-primary-50 border border-primary-100 rounded-xl p-5">
              <p className="text-sm font-semibold text-primary-800 mb-1">Bu teklifi satın almak ister misiniz?</p>
              <p className="text-xs text-primary-600 mb-4">
                Aşağıdaki butona tıklayarak teklif kalemlerini sepetinize ekleyip ödeme sayfasına yönlendirileceksiniz.
                Teklif fiyatları otomatik uygulanır.
              </p>
              <QuoteBuyButton items={q.items} quoteId={q.id} />
            </div>
          </div>
        )}

        {/* Note */}
        {q.note && (
          <div className="px-8 pb-6">
            <div className="bg-accent-50 border border-accent-100 rounded-xl p-5">
              <p className="text-xs font-semibold text-accent-700 uppercase tracking-wider mb-2">Not</p>
              <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">{q.note}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-8 py-5 bg-neutral-50 border-t border-neutral-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <div className="flex flex-wrap gap-4">
              {companyPhone && (
                <a href={`tel:${companyPhone}`} className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-primary-600 transition-colors">
                  <Phone className="w-3.5 h-3.5" />
                  {companyPhone}
                </a>
              )}
              {companyEmail && (
                <a href={`mailto:${companyEmail}`} className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-primary-600 transition-colors">
                  <Mail className="w-3.5 h-3.5" />
                  {companyEmail}
                </a>
              )}
              {companyAddress && (
                <span className="text-xs text-neutral-400">{companyAddress}</span>
              )}
            </div>
            <p className="text-xs text-neutral-400 font-mono shrink-0">{q.quote_number}</p>
          </div>
          <p className="text-xs text-neutral-400">Bu teklif bilgilendirme amaçlıdır. Fiyatlar KDV dahildir.</p>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  )
}
