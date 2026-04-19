'use client'

import { useState, useEffect } from 'react'
import { Check, X, Star, MessageSquareDashed, Package } from 'lucide-react'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending') // pending, approved, rejected, all

  async function fetchReviews() {
    setLoading(true)
    let query = supabase.from('reviews').select(`
      *,
      user:profiles(full_name, email),
      product:products(name, slug)
    `).order('created_at', { ascending: false })
    
    if (filter !== 'all') {
      query = query.eq('status', filter)
    }
    
    const { data } = await query
    setReviews(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchReviews() }, [filter])

  async function handleStatusUpdate(id: string, newStatus: string) {
    await supabase.from('reviews').update({ status: newStatus }).eq('id', id)
    fetchReviews()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 font-heading">Ürün Yorumları</h1>
        <p className="text-sm text-neutral-500 mt-1">Müşteri yorumlarını onaylayın veya reddedin</p>
      </div>

      <div className="flex items-center gap-2 border-b border-neutral-200">
        {[
          { id: 'pending', label: 'Onay Bekleyenler' },
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

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden w-full max-w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600 text-xs uppercase tracking-wider border-b border-neutral-100">
              <tr>
                <th className="text-left py-3 px-6 font-semibold">Müşteri & Ürün</th>
                <th className="text-left py-3 px-6 font-semibold">Değerlendirme & Yorum</th>
                <th className="text-center py-3 px-6 font-semibold">Tarih</th>
                <th className="text-right py-3 px-6 font-semibold">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                [...Array(4)].map((_, i) => <tr key={i}><td colSpan={4} className="p-6"><div className="h-16 skeleton rounded" /></td></tr>)
              ) : reviews.length === 0 ? (
                 <tr>
                    <td colSpan={4} className="py-16 text-center text-neutral-400">
                      <MessageSquareDashed className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">Yorum bulunamadı</p>
                    </td>
                 </tr>
              ) : reviews.map(review => (
                <tr key={review.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-4 px-6 align-top">
                    <p className="font-bold text-neutral-900">{review.user?.full_name || 'Gizli Kullanıcı'}</p>
                    <p className="text-xs text-neutral-500 mb-2">{review.user?.email || 'Bilinmiyor'}</p>
                    <a href={`/urun/${review.product?.slug}`} target="_blank" className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline bg-primary-50 px-2 py-1 rounded">
                      <Package className="w-3 h-3 text-primary-600" /> {review.product?.name || 'Silinmiş Ürün'}
                    </a>
                  </td>
                  <td className="py-4 px-6 align-top min-w-[300px]">
                    <div className="flex items-center gap-1 mb-2">
                       {[...Array(5)].map((_, i) => (
                         <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-neutral-200'}`} />
                       ))}
                    </div>
                    {review.comment ? (
                      <p className="text-sm text-neutral-700 leading-relaxed italic">&quot;{review.comment}&quot;</p>
                    ) : (
                      <p className="text-sm text-neutral-400 italic">Sadece puanlama yapılmış.</p>
                    )}
                  </td>
                  <td className="py-4 px-6 align-top text-center text-neutral-500 text-xs">
                    {formatDate(review.created_at)}
                  </td>
                  <td className="py-4 px-6 align-top text-right">
                    {review.status === 'pending' ? (
                       <div className="flex items-center justify-end gap-2">
                         <button onClick={() => handleStatusUpdate(review.id, 'rejected')} className="btn btn-sm btn-outline border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300" title="Reddet">
                           <X className="w-4 h-4" />
                         </button>
                         <button onClick={() => handleStatusUpdate(review.id, 'approved')} className="btn btn-sm bg-green-500 hover:bg-green-600 text-white border-0" title="Onayla">
                           <Check className="w-4 h-4" />
                         </button>
                       </div>
                    ) : (
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase
                        ${review.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                      `}>
                        {review.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
