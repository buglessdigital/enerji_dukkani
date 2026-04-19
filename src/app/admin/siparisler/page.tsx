'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Eye, Filter, Download, ArrowUpDown, FileText } from 'lucide-react'
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
  cancelled: 'İptal',
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    async function fetchOrders() {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, order_number, total, status, payment_method, payment_status, created_at,
          user:profiles(full_name, email)
        `)
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setOrders(data)
      }
      setLoading(false)
    }
    fetchOrders()
  }, [])

  const filteredOrders = orders.filter(order => {
    const s = search.toLowerCase()
    const matchesSearch = 
      order.order_number.toLowerCase().includes(s) ||
      (order.user?.full_name?.toLowerCase() || '').includes(s) ||
      (order.user?.email?.toLowerCase() || '').includes(s)
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 font-heading">Sipariş Yönetimi</h1>
          <p className="text-sm text-neutral-500 mt-1">Siparişleri izleyin ve yönetin</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-outline bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-700">
            <Download className="w-4 h-4" /> Dışa Aktar (CSV)
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Sipariş No, müşteri adı veya e-posta ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-neutral-400 shrink-0" />
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none md:w-48 appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right .5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
          >
            <option value="all">Tüm Durumlar</option>
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden w-full max-w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 text-neutral-600 text-xs uppercase tracking-wider">
                <th className="text-left py-4 px-6 font-semibold">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-primary-600">Sipariş No <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="text-left py-4 px-6 font-semibold">Tarih</th>
                <th className="text-left py-4 px-6 font-semibold">Müşteri</th>
                <th className="text-left py-4 px-6 font-semibold">Tutar</th>
                <th className="text-left py-4 px-6 font-semibold">Ödeme</th>
                <th className="text-left py-4 px-6 font-semibold">Durum</th>
                <th className="text-right py-4 px-6 font-semibold">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}><td colSpan={7} className="py-4 px-6"><div className="h-10 skeleton rounded" /></td></tr>
                ))
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-neutral-400">
                    <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Kriterlere uygun sipariş bulunamadı</p>
                  </td>
                </tr>
              ) : filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-neutral-900">{order.order_number}</td>
                  <td className="py-4 px-6 text-neutral-500 text-xs whitespace-nowrap">{formatDate(order.created_at)}</td>
                  <td className="py-4 px-6">
                    <p className="font-medium text-neutral-900 line-clamp-1">{order.user?.full_name || 'Misafir'}</p>
                    <p className="text-xs text-neutral-500 line-clamp-1">{order.user?.email}</p>
                  </td>
                  <td className="py-4 px-6 font-semibold text-neutral-900 whitespace-nowrap">{formatPrice(order.total)}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-600">
                        {order.payment_method === 'credit_card' ? 'Kredi Kartı' : 
                         order.payment_method === 'bank_transfer' ? 'Havale/EFT' : order.payment_method}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${order.payment_status === 'paid' ? 'bg-green-500' : 'bg-amber-500'}`} title={order.payment_status} />
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${statusColors[order.status] || 'bg-neutral-100 text-neutral-600'}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link href={`/admin/siparisler/${order.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 text-neutral-700 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50 rounded-lg transition-all text-xs font-semibold">
                      <Eye className="w-3.5 h-3.5" /> Detay
                    </Link>
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
