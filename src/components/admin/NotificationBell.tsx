'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Bell, ShoppingCart, Star, Users, Package, Check, CheckCheck, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Notification {
  id: string
  type: 'order' | 'review' | 'dealer' | 'stock'
  title: string
  message: string
  link: string | null
  is_read: boolean
  created_at: string
}

const typeConfig = {
  order: { icon: ShoppingCart, color: 'bg-blue-100 text-blue-600' },
  review: { icon: Star, color: 'bg-amber-100 text-amber-600' },
  dealer: { icon: Users, color: 'bg-violet-100 text-violet-600' },
  stock: { icon: Package, color: 'bg-red-100 text-red-600' },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Az önce'
  if (mins < 60) return `${mins} dk önce`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} sa önce`
  const days = Math.floor(hours / 24)
  return `${days} gün önce`
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const ref = useRef<HTMLDivElement>(null)
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const unreadCount = notifications.filter(n => !n.is_read).length

  const fetchNotifications = useCallback(async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    setNotifications((data as Notification[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchNotifications()

    // Realtime subscription
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev].slice(0, 20))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchNotifications])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleMouseEnter() {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
    setOpen(true)
  }

  function handleMouseLeave() {
    hoverTimeout.current = setTimeout(() => setOpen(false), 200)
  }

  async function markAsRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function markAllAsRead() {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  async function deleteNotification(e: React.MouseEvent, id: string) {
    e.preventDefault()
    e.stopPropagation()
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 text-neutral-500 hover:text-primary-600 rounded-lg hover:bg-neutral-100 transition-colors"
        aria-label="Bildirimler"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-xl border border-neutral-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <span className="font-bold text-neutral-900 text-sm">Bildirimler</span>
              {unreadCount > 0 && (
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} yeni
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Tümünü okundu işaretle
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-neutral-50">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3">
                  <div className="w-9 h-9 skeleton rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2 pt-0.5">
                    <div className="h-3.5 skeleton rounded w-32" />
                    <div className="h-3 skeleton rounded w-48" />
                    <div className="h-3 skeleton rounded w-20" />
                  </div>
                </div>
              ))
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center text-neutral-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Bildirim yok</p>
              </div>
            ) : (
              notifications.map(n => {
                const cfg = typeConfig[n.type] || typeConfig.order
                const Icon = cfg.icon
                const Wrapper = n.link ? Link : 'div'
                const wrapperProps = n.link
                  ? { href: n.link, onClick: () => { markAsRead(n.id); setOpen(false) } }
                  : {}

                return (
                  <div
                    key={n.id}
                    className={`relative flex items-start gap-3 px-4 py-3 transition-colors group ${
                      !n.is_read ? 'bg-primary-50/40 hover:bg-primary-50/70' : 'hover:bg-neutral-50'
                    }`}
                  >
                    {/* Unread dot */}
                    {!n.is_read && (
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary-500 rounded-full" />
                    )}

                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <Wrapper className="flex-1 min-w-0 cursor-pointer" {...(wrapperProps as any)}>
                      <p className={`text-sm leading-snug ${!n.is_read ? 'font-semibold text-neutral-900' : 'font-medium text-neutral-700'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-[11px] text-neutral-400 mt-1">{timeAgo(n.created_at)}</p>
                    </Wrapper>

                    {/* Actions */}
                    <div className="flex flex-col items-end gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!n.is_read && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="p-1 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Okundu işaretle"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => deleteNotification(e, n.id)}
                        className="p-1 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Sil"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-neutral-100 bg-neutral-50/60">
              <p className="text-xs text-neutral-400 text-center">Son 20 bildirim gösteriliyor</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
