'use client'

import { useState, useEffect } from 'react'
import { Check, X, Building2, MapPin, Phone, Mail, FileText, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function AdminDealers() {
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending') // pending, approved, rejected, all
  const [selectedApp, setSelectedApp] = useState<any | null>(null)

  async function fetchApps() {
    setLoading(true)
    let query = supabase.from('dealer_applications').select('*').order('created_at', { ascending: false })
    if (filter !== 'all') {
      query = query.eq('status', filter)
    }
    const { data } = await query
    setApps(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchApps() }, [filter])

  async function handleStatusUpdate(id: string, newStatus: string) {
    if (!confirm(`Başvuruyu ${newStatus === 'approved' ? 'onaylamak' : 'reddetmek'} istediğinizden emin misiniz?`)) return
    await supabase.from('dealer_applications').update({ status: newStatus }).eq('id', id)
    fetchApps()
    setSelectedApp(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 font-heading">Bayilik Başvuruları</h1>
          <p className="text-sm text-neutral-500 mt-1">Yeni bayi başvurularını inceleyin ve yönetin</p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-neutral-200">
        {[
          { id: 'pending', label: 'Bekleyenler' },
          { id: 'approved', label: 'Onaylananlar' },
          { id: 'rejected', label: 'Reddedilenler' },
          { id: 'all', label: 'Tümü' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              filter === tab.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* List */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600 text-xs uppercase tracking-wider border-b border-neutral-100">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold">Firma</th>
                  <th className="text-left py-3 px-4 font-semibold">Yetkili / Alan</th>
                  <th className="text-left py-3 px-4 font-semibold">Tarih</th>
                  <th className="text-right py-3 px-4 font-semibold">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loading ? (
                  [...Array(4)].map((_, i) => <tr key={i}><td colSpan={4} className="p-4"><div className="h-10 skeleton rounded" /></td></tr>)
                ) : apps.length === 0 ? (
                   <tr><td colSpan={4} className="p-8 text-center text-neutral-400">Başvuru bulunamadı</td></tr>
                ) : apps.map(app => (
                  <tr 
                    key={app.id} 
                    onClick={() => setSelectedApp(app)}
                    className={`cursor-pointer transition-colors ${selectedApp?.id === app.id ? 'bg-primary-50 border-l-2 border-primary-600' : 'hover:bg-neutral-50 border-l-2 border-transparent'}`}
                  >
                    <td className="py-3 px-4">
                      <p className="font-bold text-neutral-900">{app.company_name}</p>
                      <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {app.city || 'Belirtilmemiş'}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-neutral-800">{app.contact_name}</p>
                      <p className="text-xs text-neutral-500 truncate max-w-[150px]">{app.business_area}</p>
                    </td>
                    <td className="py-3 px-4 text-neutral-500 text-xs">{formatDate(app.created_at)}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold uppercase
                        ${app.status === 'pending' ? 'bg-amber-100 text-amber-700' : app.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                      `}>
                        {app.status === 'pending' ? 'Bekliyor' : app.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        {selectedApp ? (
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-neutral-100 sticky top-24 overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
              <h2 className="font-bold text-neutral-900">Başvuru Detayı</h2>
              <button onClick={() => setSelectedApp(null)} className="p-1 text-neutral-400 hover:text-neutral-700 rounded"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase text-neutral-400 mb-1">Firma Ünvanı</h3>
                <p className="font-bold text-neutral-900 flex items-center gap-2"><Building2 className="w-4 h-4 text-primary-500" /> {selectedApp.company_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-bold uppercase text-neutral-400 mb-1">Vergi Dairesi</h3>
                  <p className="text-sm text-neutral-800">{selectedApp.tax_office}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase text-neutral-400 mb-1">Vergi No / Tc</h3>
                  <p className="text-sm font-mono text-neutral-800">{selectedApp.tax_number}</p>
                </div>
              </div>
              <div className="pt-3 border-t border-neutral-100">
                <h3 className="text-xs font-bold uppercase text-neutral-400 mb-2">Yetkili Kişi & İletişim</h3>
                <p className="font-bold text-neutral-900 mb-1">{selectedApp.contact_name}</p>
                <div className="space-y-1.5">
                  <a href={`tel:${selectedApp.phone}`} className="flex items-center gap-2 text-sm text-neutral-600 hover:text-primary-600"><Phone className="w-3.5 h-3.5" /> {selectedApp.phone}</a>
                  <a href={`mailto:${selectedApp.email}`} className="flex items-center gap-2 text-sm text-neutral-600 hover:text-primary-600"><Mail className="w-3.5 h-3.5" /> {selectedApp.email}</a>
                </div>
              </div>
              <div className="pt-3 border-t border-neutral-100">
                <h3 className="text-xs font-bold uppercase text-neutral-400 mb-1">Faaliyet Alanı</h3>
                <p className="text-sm text-neutral-800 bg-neutral-100 px-3 py-2 rounded-lg">{selectedApp.business_area}</p>
              </div>
               <div className="pt-3 border-t border-neutral-100">
                <h3 className="text-xs font-bold uppercase text-neutral-400 mb-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Adres</h3>
                <p className="text-sm text-neutral-600 bg-neutral-50 p-3 rounded-lg leading-relaxed whitespace-pre-line">
                  {selectedApp.address}
                  <br/> <span className="font-medium text-neutral-900 mt-1 block">{selectedApp.city}</span>
                </p>
              </div>

            </div>

            {selectedApp.status === 'pending' && (
              <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex gap-3">
                <button onClick={() => handleStatusUpdate(selectedApp.id, 'rejected')} className="flex-1 btn btn-outline border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300">
                  <X className="w-4 h-4" /> Reddet
                </button>
                <button onClick={() => handleStatusUpdate(selectedApp.id, 'approved')} className="flex-1 btn bg-green-500 hover:bg-green-600 text-white border-0">
                  <Check className="w-4 h-4" /> Onayla
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="lg:col-span-1 bg-neutral-50 rounded-2xl border border-neutral-100 border-dashed flex items-center justify-center p-8 text-center text-neutral-400 h-64 sticky top-24">
            <div>
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Detayları görmek için listeden bir başvuru seçin.</p>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
