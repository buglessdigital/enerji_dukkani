'use client'

import { useState, useEffect } from 'react'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'
import { Mail, Trash2, Eye, EyeOff, Phone, User, Clock } from 'lucide-react'

interface ContactMessage {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string | null
  message: string
  is_read: boolean
  created_at: string
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    fetchMessages()
  }, [])

  async function fetchMessages() {
    const { data } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setMessages(data)
    setLoading(false)
  }

  async function markAsRead(id: string, isRead: boolean) {
    await supabase
      .from('contact_messages')
      .update({ is_read: isRead })
      .eq('id', id)
    setMessages(prev =>
      prev.map(m => m.id === id ? { ...m, is_read: isRead } : m)
    )
  }

  async function deleteMessage(id: string) {
    if (!confirm('Bu mesajı silmek istediğinizden emin misiniz?')) return
    await supabase.from('contact_messages').delete().eq('id', id)
    setMessages(prev => prev.filter(m => m.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  async function markAllAsRead() {
    await supabase
      .from('contact_messages')
      .update({ is_read: true })
      .eq('is_read', false)
    setMessages(prev => prev.map(m => ({ ...m, is_read: true })))
  }

  const selected = messages.find(m => m.id === selectedId)
  const unreadCount = messages.filter(m => !m.is_read).length

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Az önce'
    if (mins < 60) return `${mins} dk önce`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} saat önce`
    const days = Math.floor(hours / 24)
    return `${days} gün önce`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 font-heading">İletişim Mesajları</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {unreadCount > 0 ? (
              <span className="text-primary-600 font-medium">{unreadCount} okunmamış mesaj</span>
            ) : (
              'Tüm mesajlar okundu'
            )}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="btn btn-outline btn-sm">
            Tümünü Okundu İşaretle
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 skeleton rounded-xl" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-100 p-16 text-center">
          <Mail className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500 font-medium">Henüz mesaj yok</p>
          <p className="text-sm text-neutral-400 mt-1">İletişim formundan gönderilen mesajlar burada görünecek.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-4 items-start">
          {/* Message List */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-100 overflow-hidden">
            <div className="divide-y divide-neutral-100">
              {messages.map(msg => (
                <button
                  key={msg.id}
                  onClick={async () => {
                    setSelectedId(msg.id)
                    if (!msg.is_read) await markAsRead(msg.id, true)
                  }}
                  className={`w-full text-left px-4 py-4 transition-colors hover:bg-neutral-50 ${
                    selectedId === msg.id ? 'bg-primary-50 border-l-2 border-primary-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {!msg.is_read && (
                        <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-1" />
                      )}
                      <div className="min-w-0">
                        <p className={`text-sm truncate ${!msg.is_read ? 'font-semibold text-neutral-900' : 'font-medium text-neutral-700'}`}>
                          {msg.name}
                        </p>
                        <p className="text-xs text-neutral-400 truncate">{msg.email}</p>
                        {msg.subject && (
                          <p className="text-xs text-neutral-500 truncate mt-0.5">{msg.subject}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-neutral-400 shrink-0 mt-0.5">{timeAgo(msg.created_at)}</span>
                  </div>
                  <p className="text-xs text-neutral-400 truncate mt-1.5 pl-4">{msg.message}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-3">
            {selected ? (
              <div className="bg-white rounded-2xl border border-neutral-100 p-6 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900">{selected.subject || 'Konu belirtilmemiş'}</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {new Date(selected.created_at).toLocaleDateString('tr-TR', {
                        day: 'numeric', month: 'long', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => markAsRead(selected.id, !selected.is_read)}
                      className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title={selected.is_read ? 'Okunmadı işaretle' : 'Okundu işaretle'}
                    >
                      {selected.is_read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => deleteMessage(selected.id)}
                      className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 bg-neutral-50 rounded-xl px-3 py-2.5">
                    <User className="w-4 h-4 text-neutral-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-neutral-400 uppercase tracking-wide">Gönderen</p>
                      <p className="text-sm font-medium text-neutral-800 truncate">{selected.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-neutral-50 rounded-xl px-3 py-2.5">
                    <Mail className="w-4 h-4 text-neutral-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-neutral-400 uppercase tracking-wide">E-Posta</p>
                      <a href={`mailto:${selected.email}`} className="text-sm font-medium text-primary-600 hover:underline truncate block">
                        {selected.email}
                      </a>
                    </div>
                  </div>
                  {selected.phone && (
                    <div className="flex items-center gap-2 bg-neutral-50 rounded-xl px-3 py-2.5">
                      <Phone className="w-4 h-4 text-neutral-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-neutral-400 uppercase tracking-wide">Telefon</p>
                        <a href={`tel:${selected.phone}`} className="text-sm font-medium text-neutral-800 truncate block">
                          {selected.phone}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-neutral-50 rounded-xl p-4">
                  <p className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed">{selected.message}</p>
                </div>

                <a
                  href={`mailto:${selected.email}?subject=Re: ${selected.subject || 'İletişim Formu'}`}
                  className="btn btn-primary btn-sm inline-flex"
                >
                  <Mail className="w-4 h-4 mr-1.5" />
                  E-Posta ile Yanıtla
                </a>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-neutral-100 p-16 text-center">
                <Mail className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
                <p className="text-sm text-neutral-400">Görüntülemek için sol taraftan bir mesaj seçin</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
