'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  DollarSign,
  ShoppingCart,
  Users,
  AlertTriangle,
  Package,
  Star,
  UserPlus,
  TrendingUp,
  TrendingDown,
  Eye,
  Clock,
} from 'lucide-react'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'

interface DashboardStats {
  totalRevenue: number
  pendingOrders: number
  totalCustomers: number
  lowStockCount: number
  totalProducts: number
  pendingReviews: number
  pendingDealerApps: number
}

interface RecentOrder {
  id: string
  order_number: string
  total: number
  status: string
  payment_method: string
  created_at: string
  user: { full_name: string; email: string } | null
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

function formatPrice(price: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
  }).format(price)
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    pendingOrders: 0,
    totalCustomers: 0,
    lowStockCount: 0,
    totalProducts: 0,
    pendingReviews: 0,
    pendingDealerApps: 0,
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch stats in parallel
        const [
          revenueRes,
          pendingOrdersRes,
          customersRes,
          lowStockRes,
          productsRes,
          reviewsRes,
          dealerAppsRes,
          ordersRes,
        ] = await Promise.all([
          supabase.from('orders').select('total').eq('payment_status', 'paid'),
          supabase.from('orders').select('id', { count: 'exact', head: true }).in('status', ['pending', 'processing']),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
          supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true).lte('stock_quantity', 5),
          supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('dealer_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('orders').select('id, order_number, total, status, payment_method, created_at, user:profiles(full_name, email)').order('created_at', { ascending: false }).limit(10),
        ])

        const revenue = revenueRes.data?.reduce((sum, o) => sum + (o.total || 0), 0) || 0

        setStats({
          totalRevenue: revenue,
          pendingOrders: pendingOrdersRes.count ?? 0,
          totalCustomers: customersRes.count ?? 0,
          lowStockCount: lowStockRes.count ?? 0,
          totalProducts: productsRes.count ?? 0,
          pendingReviews: reviewsRes.count ?? 0,
          pendingDealerApps: dealerAppsRes.count ?? 0,
        })

        setRecentOrders((ordersRes.data as any) || [])
      } catch (error) {
        console.error('Dashboard fetch error:', error)
      }
      setLoading(false)
    }
    fetchDashboardData()
  }, [])

  const statCards = [
    {
      label: 'Toplam Ciro',
      value: formatPrice(stats.totalRevenue),
      icon: DollarSign,
      color: 'bg-emerald-500',
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      label: 'Bekleyen Siparişler',
      value: stats.pendingOrders.toString(),
      icon: ShoppingCart,
      color: 'bg-amber-500',
      bgLight: 'bg-amber-50',
      textColor: 'text-amber-600',
      link: '/admin/siparisler',
    },
    {
      label: 'Toplam Müşteri',
      value: stats.totalCustomers.toString(),
      icon: Users,
      color: 'bg-blue-500',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: 'Kritik Stok Uyarısı',
      value: stats.lowStockCount.toString(),
      icon: AlertTriangle,
      color: 'bg-red-500',
      bgLight: 'bg-red-50',
      textColor: 'text-red-600',
      link: '/admin/urunler',
    },
  ]

  const quickStats = [
    { label: 'Aktif Ürün', value: stats.totalProducts, icon: Package, link: '/admin/urunler' },
    { label: 'Bekleyen Yorum', value: stats.pendingReviews, icon: Star, link: '/admin/yorumlar' },
    { label: 'Bayi Başvurusu', value: stats.pendingDealerApps, icon: UserPlus, link: '/admin/bayiler' },
  ]

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-neutral-500 font-medium">{card.label}</p>
                {loading ? (
                  <div className="h-8 w-24 skeleton rounded mt-2" />
                ) : (
                  <p className="text-2xl font-bold text-neutral-900 mt-1 font-heading">{card.value}</p>
                )}
              </div>
              <div className={`w-12 h-12 ${card.bgLight} rounded-xl flex items-center justify-center`}>
                <card.icon className={`w-6 h-6 ${card.textColor}`} />
              </div>
            </div>
            {card.link && (
              <Link href={card.link} className="inline-flex items-center gap-1 text-xs text-primary-600 font-medium mt-3 hover:underline">
                Detayları Gör →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickStats.map((qs) => (
          <Link
            key={qs.label}
            href={qs.link}
            className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100 flex items-center gap-4 hover:shadow-md hover:border-primary-200 transition-all"
          >
            <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
              <qs.icon className="w-5 h-5 text-neutral-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">{qs.label}</p>
              {loading ? (
                <div className="h-5 w-8 skeleton rounded mt-1" />
              ) : (
                <p className="text-lg font-bold text-neutral-900">{qs.value}</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden w-full max-w-full">
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 font-heading">Son Siparişler</h2>
            <p className="text-sm text-neutral-500 mt-0.5">Son 10 sipariş</p>
          </div>
          <Link href="/admin/siparisler" className="text-sm text-primary-600 font-medium hover:underline">
            Tümünü Gör
          </Link>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 text-neutral-600 text-xs uppercase tracking-wider">
                <th className="text-left py-3 px-6 font-semibold">Sipariş No</th>
                <th className="text-left py-3 px-6 font-semibold">Müşteri</th>
                <th className="text-left py-3 px-6 font-semibold">Tutar</th>
                <th className="text-left py-3 px-6 font-semibold">Ödeme</th>
                <th className="text-left py-3 px-6 font-semibold">Durum</th>
                <th className="text-left py-3 px-6 font-semibold">Tarih</th>
                <th className="text-left py-3 px-6 font-semibold">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="py-4 px-6"><div className="h-4 w-28 skeleton rounded" /></td>
                    <td className="py-4 px-6"><div className="h-4 w-32 skeleton rounded" /></td>
                    <td className="py-4 px-6"><div className="h-4 w-20 skeleton rounded" /></td>
                    <td className="py-4 px-6"><div className="h-4 w-20 skeleton rounded" /></td>
                    <td className="py-4 px-6"><div className="h-5 w-24 skeleton rounded-full" /></td>
                    <td className="py-4 px-6"><div className="h-4 w-28 skeleton rounded" /></td>
                    <td className="py-4 px-6"><div className="h-4 w-16 skeleton rounded" /></td>
                  </tr>
                ))
              ) : recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>Henüz sipariş yok</p>
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-4 px-6 font-mono font-semibold text-neutral-900">{order.order_number}</td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium text-neutral-800">{(order.user as any)?.full_name || '—'}</p>
                        <p className="text-xs text-neutral-400">{(order.user as any)?.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-semibold text-neutral-900">{formatPrice(order.total)}</td>
                    <td className="py-4 px-6 text-neutral-600">{order.payment_method === 'credit_card' ? 'Kredi Kartı' : order.payment_method}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[order.status] || 'bg-neutral-100 text-neutral-600'}`}>
                        {statusLabels[order.status] || order.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-neutral-500 text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(order.created_at)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Link href={`/admin/siparisler/${order.id}`} className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium text-xs">
                        <Eye className="w-3.5 h-3.5" />
                        Görüntüle
                      </Link>
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
